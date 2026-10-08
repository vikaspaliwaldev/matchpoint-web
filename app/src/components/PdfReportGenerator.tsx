'use client';

import React from 'react';
import { Tournament, TournamentEvent, Match } from '@/types';

interface PdfReportGeneratorProps {
  tournament: Tournament;
  event: TournamentEvent;
  matches: Match[];
}

export default function PdfReportGenerator({ tournament, event, matches }: PdfReportGeneratorProps) {
  const handlePrint = () => {
    // We create a temporary hidden iframe or div, populate it with print-optimized styles and HTML,
    // and trigger the print window. This is 100% clean and doesn't pollute the main dashboard UI.
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to print results.');
      return;
    }

    // Group matches by round
    const matchesByRound = matches.reduce((acc, m) => {
      const r = m.fixture_round;
      if (r === undefined || r === null) return acc;
      if (!acc[r]) acc[r] = [];
      acc[r].push(m);
      return acc;
    }, {} as Record<number, Match[]>);

    const totalRounds = Math.max(...Object.keys(matchesByRound).map(Number), 0) + 1;

    const roundName = (roundNum: number) => {
      const fromFinal = totalRounds - 1 - roundNum;
      switch (fromFinal) {
        case 0: return 'Final';
        case 1: return 'Semi Finals';
        case 2: return 'Quarter Finals';
        default: return `Round ${roundNum + 1}`;
      }
    };

    // Determine Winner and Runner Up
    const finalMatches = matchesByRound[totalRounds - 1] || [];
    const championMatch = finalMatches.find(m => m.status === 'completed' && m.winner_id);
    let championName = '—';
    let runnerUpName = '—';

    if (championMatch) {
      if (championMatch.winner_id === championMatch.player1_id) {
        championName = championMatch.player1_name;
        runnerUpName = championMatch.player2_name;
      } else {
        championName = championMatch.player2_name;
        runnerUpName = championMatch.player1_name;
      }
    }

    const matchesListHtml = Object.entries(matchesByRound)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([roundNum, roundMatches]) => {
        const rows = roundMatches.map(m => {
          const isComplete = m.status === 'completed';
          let score = 'Scheduled';
          if (isComplete) {
            // Calculate set scores
            let s1 = 0, s2 = 0;
            m.sets.forEach(s => {
              if (s.is_complete && s.winner_id) {
                if (s.winner_id === m.player1_id) s1++;
                else s2++;
              }
            });
            score = `${s1} - ${s2}`;
          } else if (m.status === 'running') {
            score = 'LIVE';
          }
          return `
            <tr>
              <td>${m.player1_name}</td>
              <td style="text-align: center; font-weight: 700; color: #2563eb;">vs</td>
              <td>${m.player2_name}</td>
              <td style="text-align: center;">${m.court || '—'}</td>
              <td style="text-align: center; font-weight: bold;">${score}</td>
            </tr>
          `;
        }).join('');

        return `
          <div class="round-section">
            <h3 class="round-title">${roundName(Number(roundNum))}</h3>
            <table>
              <thead>
                <tr>
                  <th>Competitor 1</th>
                  <th style="width: 40px; text-align: center;">VS</th>
                  <th>Competitor 2</th>
                  <th style="width: 100px; text-align: center;">Court</th>
                  <th style="width: 120px; text-align: center;">Result</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${tournament.name} - ${event.event_name} Results</title>
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
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 6px 0;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .header h2 {
              font-size: 18px;
              font-weight: 600;
              margin: 0 0 10px 0;
              color: #2563eb;
            }
            .meta-grid {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              font-size: 14px;
              background-color: #f8fafc;
              padding: 16px 20px;
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
            .podium-section {
              display: flex;
              gap: 20px;
              margin-bottom: 40px;
            }
            .podium-card {
              flex: 1;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
            }
            .podium-card.champion {
              border: 2px solid #eab308;
              background: linear-gradient(to bottom, #fef08a10, #ffffff);
            }
            .podium-card.runner-up {
              border: 2px solid #94a3b8;
              background: linear-gradient(to bottom, #f1f5f920, #ffffff);
            }
            .podium-badge {
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 4px 12px;
              border-radius: 9999px;
              display: inline-block;
              margin-bottom: 12px;
            }
            .champion .podium-badge {
              background-color: #fef08a;
              color: #854d0e;
            }
            .runner-up .podium-badge {
              background-color: #e2e8f0;
              color: #334155;
            }
            .podium-name {
              font-size: 20px;
              font-weight: 700;
              color: #0f172a;
            }
            .round-section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .round-title {
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
              margin-bottom: 20px;
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
            tr:hover {
              background-color: #f8fafc;
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
              width: 200px;
            }
            .sig-line {
              border-top: 1px solid #94a3b8;
              margin-top: 40px;
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
            <h1>MatchPoint Tournament Report</h1>
            <h2>${tournament.name}</h2>
            <div style="font-size: 14px; color: #64748b; font-weight: 500;">Official Standings & Fixtures Sheet</div>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <strong>Event / Category</strong>
              <span>${event.event_name}</span>
            </div>
            <div class="meta-item">
              <strong>Location</strong>
              <span>📍 ${tournament.location}</span>
            </div>
            <div class="meta-item">
              <strong>Tournament Dates</strong>
              <span>📅 ${new Date(tournament.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>

          <div class="podium-section">
            <div class="podium-card champion">
              <span class="podium-badge">Champion 🏆</span>
              <div class="podium-name">${championName}</div>
            </div>
            <div class="podium-card runner-up">
              <span class="podium-badge">Runner Up 🥈</span>
              <div class="podium-name">${runnerUpName}</div>
            </div>
          </div>

          ${matchesListHtml}

          <div class="footer-block">
            <div class="sig-block">
              <div class="sig-line">Tournament Director Signature</div>
            </div>
            <div class="sig-block">
              <div style="font-size: 12px; font-weight: 600; color: #2563eb; margin-bottom: 25px;">MatchPoint Certified</div>
              <div class="sig-line">Official Referee Signature</div>
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
    <button
      className="btn btn-secondary"
      onClick={handlePrint}
      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
    >
      📄 Export Results (PDF)
    </button>
  );
}
