'use client';

import React from 'react';
import { Match, Tournament, TournamentEvent } from '@/types';
import { IconX } from '@/components/icons';

interface MatchSummaryModalProps {
  match: Match;
  tournament?: Tournament;
  event?: TournamentEvent;
  onClose: () => void;
}

export default function MatchSummaryModal({
  match,
  tournament,
  event,
  onClose,
}: MatchSummaryModalProps) {
  const winnerName = match.winner_id
    ? match.winner_id === match.player1_id
      ? match.player1_name
      : match.player2_name
    : '—';

  const formatDuration = (sec?: number) => {
    if (!sec) return '—';
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print the match summary.');
      return;
    }

    const setRows = match.sets.map((set) => {
      const isP1Winner = set.winner_id === match.player1_id;
      const isP2Winner = set.winner_id === match.player2_id;
      let setWinner = '—';
      if (isP1Winner) setWinner = match.player1_name;
      else if (isP2Winner) setWinner = match.player2_name;

      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">Set ${set.set_number}</td>
          <td style="text-align: center; font-weight: ${isP1Winner ? 'bold' : 'normal'}; color: ${isP1Winner ? '#2563eb' : '#1e293b'};">${set.player1_score}</td>
          <td style="text-align: center; font-weight: ${isP2Winner ? 'bold' : 'normal'}; color: ${isP2Winner ? '#2563eb' : '#1e293b'};">${set.player2_score}</td>
          <td style="text-align: center; font-weight: 500;">${setWinner}</td>
        </tr>
      `;
    }).join('');

    const formattedDate = match.scheduled_time
      ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })
      : '—';

    printWindow.document.write(`
      <html>
        <head>
          <title>Match Summary: ${match.player1_name} vs ${match.player2_name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');
            body {
              font-family: 'Outfit', sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              margin: 0;
              padding: 40px;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 24px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 26px;
              font-weight: 700;
              margin: 0 0 6px 0;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header h2 {
              font-size: 18px;
              font-weight: 600;
              margin: 0;
              color: #2563eb;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 30px;
              font-size: 14px;
              background-color: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .meta-item strong {
              color: #475569;
              display: block;
              margin-bottom: 4px;
            }
            .meta-item span {
              font-weight: 600;
              color: #0f172a;
            }
            .winner-banner {
              text-align: center;
              background: linear-gradient(135deg, #22c55e15, #15803d15);
              border: 1px solid #22c55e50;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 30px;
              font-size: 18px;
              font-weight: 700;
              color: #15803d;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              text-transform: uppercase;
              color: #475569;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 8px;
              margin-bottom: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 600;
              font-size: 12px;
              text-transform: uppercase;
              padding: 10px 14px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            td {
              padding: 12px 14px;
              font-size: 14px;
              border-bottom: 1px solid #e2e8f0;
            }
            .footer-block {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              padding-top: 30px;
              border-top: 1px solid #cbd5e1;
              page-break-inside: avoid;
            }
            .sig-block {
              text-align: center;
              width: 220px;
            }
            .sig-line {
              border-top: 1px solid #94a3b8;
              margin-top: 50px;
              padding-top: 8px;
              font-size: 12px;
              font-weight: 500;
              color: #64748b;
            }
            @media print {
              body {
                padding: 20px;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MatchPoint Match Summary</h1>
            <h2>${match.player1_name} vs ${match.player2_name}</h2>
          </div>

          <div class="winner-banner">
            Winner: ${winnerName} 🏆
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Match Source / Tournament</strong>
              <span>${tournament ? `🏆 ${tournament.name}` : '🏸 Adhoc Match'}</span>
            </div>
            <div class="meta-item">
              <strong>Event / Category</strong>
              <span>${event?.category || (match.is_adhoc ? (match.adhoc_type ? match.adhoc_type.toUpperCase() : 'ADHOC') : '—')}</span>
            </div>
            <div class="meta-item">
              <strong>Court</strong>
              <span>${match.court || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Umpire</strong>
              <span>👤 ${match.umpire_name || '—'}</span>
            </div>
            <div class="meta-item">
              <strong>Date & Time</strong>
              <span>📅 ${formattedDate}</span>
            </div>
            <div class="meta-item">
              <strong>Match Duration</strong>
              <span>⏱ ${formatDuration(match.duration_seconds)}</span>
            </div>
            <div class="meta-item">
              <strong>Peak Audience</strong>
              <span>👥 ${match.max_viewers || 0} viewers</span>
            </div>
            <div class="meta-item">
              <strong>Match Status</strong>
              <span>${match.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="section-title">Set Scores Breakdown</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 80px;">Set</th>
                <th style="text-align: center;">${match.player1_name}</th>
                <th style="text-align: center;">${match.player2_name}</th>
                <th style="text-align: center;">Winner</th>
              </tr>
            </thead>
            <tbody>
              ${setRows || '<tr><td colspan="4" style="text-align: center; color: #64748b;">No sets played</td></tr>'}
            </tbody>
          </table>

          <div class="footer-block">
            <div class="sig-block">
              <div class="sig-line">Official Umpire Signature</div>
            </div>
            <div class="sig-block">
              <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-bottom: 25px;">MatchPoint Certified</div>
              <div class="sig-line">Match Director / Referee Signature</div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Match Summary</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Completed Match Review
            </p>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><IconX size={18} /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Winner Banner */}
          <div style={{
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            Winner: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{winnerName}</span> 🏆
          </div>

          {/* Details Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
            background: 'var(--bg-secondary)',
            padding: 16,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: 13
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Type / Tournament</span>
              <span style={{ fontWeight: 600 }}>{tournament ? `🏆 ${tournament.name}` : '🏸 Adhoc Match'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Category</span>
              <span style={{ fontWeight: 600 }}>{event?.category || (match.is_adhoc ? (match.adhoc_type ? match.adhoc_type.toUpperCase() : 'ADHOC') : '—')}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Court</span>
              <span style={{ fontWeight: 600 }}>{match.court || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Umpire</span>
              <span style={{ fontWeight: 600 }}>{match.umpire_name || '—'}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Date & Time</span>
              <span style={{ fontWeight: 600 }}>
                {match.scheduled_time
                  ? new Date(match.scheduled_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : '—'
                }
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Duration</span>
              <span style={{ fontWeight: 600 }}>{formatDuration(match.duration_seconds)}</span>
            </div>
          </div>

          {/* Set Scores Table */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Set Scores</h3>
            <div className="table-container" style={{ margin: 0 }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 80, textTransform: 'uppercase', fontSize: 11 }}>Set</th>
                    <th style={{ textTransform: 'uppercase', fontSize: 11 }}>{match.player1_name}</th>
                    <th style={{ textTransform: 'uppercase', fontSize: 11 }}>{match.player2_name}</th>
                    <th style={{ textTransform: 'uppercase', fontSize: 11 }}>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {match.sets && match.sets.length > 0 ? (
                    match.sets.map((set) => {
                      const isP1Winner = set.winner_id === match.player1_id;
                      const isP2Winner = set.winner_id === match.player2_id;
                      let setWinner = '—';
                      if (isP1Winner) setWinner = match.player1_name;
                      else if (isP2Winner) setWinner = match.player2_name;

                      return (
                        <tr key={set.set_number}>
                          <td style={{ fontWeight: 500, fontSize: 13 }}>Set {set.set_number}</td>
                          <td style={{ fontWeight: isP1Winner ? 700 : 400, color: isP1Winner ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13 }}>
                            {set.player1_score}
                          </td>
                          <td style={{ fontWeight: isP2Winner ? 700 : 400, color: isP2Winner ? 'var(--accent)' : 'var(--text-primary)', fontSize: 13 }}>
                            {set.player2_score}
                          </td>
                          <td style={{ fontSize: 13 }}>{setWinner}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 12 }}>
                        No sets played
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            📄 Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
