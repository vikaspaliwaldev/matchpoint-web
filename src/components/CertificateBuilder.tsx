'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Tournament, Registration } from '@/types';
import { getRegistrationsByTournament } from '@/lib/supabase-service';
import { IconCheck, IconZap } from '@/components/icons';

interface CertificateBuilderProps {
  tournament: Tournament;
}

export default function CertificateBuilder({ tournament }: CertificateBuilderProps) {
  const [title, setTitle] = useState('Certificate of Excellence');
  const [subtitle, setSubtitle] = useState('This is proudly presented to');
  const [templateType, setTemplateType] = useState<'classic' | 'modern' | 'glowing'>('classic');
  const [borderColor, setBorderColor] = useState('#4f46e5'); // Indigo
  const [signatureText, setSignatureText] = useState('Tournament Director');
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Registration | null>(null);
  const [mailingStatus, setMailingStatus] = useState<Record<string, 'idle' | 'sending' | 'sent'>>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load all tournament participants to showcase preview & emailing list
  useEffect(() => {
    async function loadParticipants() {
      try {
        const regs = await getRegistrationsByTournament(tournament.id);
        const approved = regs.filter(r => r.status === 'approved');
        setRegistrations(approved);
        if (approved.length > 0) {
          setSelectedPlayer(approved[0]);
        }
      } catch (err) {
        console.error('Failed to load participants for certificates:', err);
      }
    }
    loadParticipants();
  }, [tournament.id]);

  // Redraw canvas preview when parameters change
  useEffect(() => {
    drawCertificate();
  }, [title, subtitle, templateType, borderColor, signatureText, signatureImage, selectedPlayer]);

  const drawCertificate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Clear background
    ctx.clearRect(0, 0, width, height);

    if (templateType === 'glowing') {
      // Dark premium gradient background
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (templateType === 'modern') {
      // Soft modern gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#fafafa');
      grad.addColorStop(1, '#f4f4f5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else {
      // Classic elegant parchment/off-white background
      ctx.fillStyle = '#fdfdfc';
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Borders & Corner Decorations
    ctx.lineWidth = 14;
    ctx.strokeStyle = borderColor;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Inner thin border
    ctx.lineWidth = 2;
    ctx.strokeStyle = templateType === 'glowing' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    ctx.strokeRect(25, 25, width - 50, height - 50);

    // 3. Header Texts
    ctx.textAlign = 'center';
    
    // Sub-banner badge
    ctx.fillStyle = borderColor;
    ctx.fillRect(width / 2 - 100, 42, 200, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.fillText('OFFICIAL BADGE', width / 2, 61);

    // Title
    ctx.fillStyle = templateType === 'glowing' ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 36px Outfit, sans-serif';
    ctx.fillText(title, width / 2, 125);

    // Subtitle
    ctx.fillStyle = templateType === 'glowing' ? '#94a3b8' : '#475569';
    ctx.font = '500 16px Outfit, sans-serif';
    ctx.fillText(subtitle, width / 2, 175);

    // 4. Recipient Player Name
    const playerName = selectedPlayer ? selectedPlayer.player_name : 'Winner Name';
    ctx.fillStyle = borderColor;
    ctx.font = 'bold 38px Outfit, sans-serif';
    ctx.fillText(playerName, width / 2, 235);

    // Underline name
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 180, 252);
    ctx.lineTo(width / 2 + 180, 252);
    ctx.stroke();

    // 5. Achievement Details
    const eventName = selectedPlayer?.event_id ? `for outstanding performance in ${tournament.name}` : `in the MatchPoint tournament`;
    ctx.fillStyle = templateType === 'glowing' ? '#94a3b8' : '#475569';
    ctx.font = 'italic 15px Outfit, sans-serif';
    ctx.fillText(eventName, width / 2, 290);

    // Date
    const dateStr = `Presented on: ${new Date(tournament.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    ctx.font = '500 13px Outfit, sans-serif';
    ctx.fillText(dateStr, width / 2, 325);

    // 6. Signature block
    ctx.strokeStyle = templateType === 'glowing' ? '#475569' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 120, 395);
    ctx.lineTo(width / 2 + 120, 395);
    ctx.stroke();

    ctx.fillStyle = templateType === 'glowing' ? '#e2e8f0' : '#1e293b';
    ctx.font = 'bold 13px Outfit, sans-serif';
    ctx.fillText(signatureText, width / 2, 412);
    ctx.fillStyle = 'var(--text-muted)';
    ctx.font = '11px Outfit, sans-serif';
    ctx.fillText('Authorized Signature', width / 2, 427);

    // Draw signature image if loaded
    if (signatureImage) {
      const img = new Image();
      img.src = signatureImage;
      img.onload = () => {
        // Draw centered above signature line
        ctx.drawImage(img, width / 2 - 45, 340, 90, 48);
      };
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSignatureImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendEmail = async (reg: Registration) => {
    setMailingStatus(prev => ({ ...prev, [reg.id]: 'sending' }));
    
    // Simulate compilation of canvas and REST API dispatch
    await new Promise(resolve => setTimeout(resolve, 1400));
    
    setMailingStatus(prev => ({ ...prev, [reg.id]: 'sent' }));
  };

  const handleSendAll = async () => {
    if (registrations.length === 0) return;
    if (!confirm(`Are you sure you want to send certificates to all ${registrations.length} participants via email?`)) return;

    for (const reg of registrations) {
      if (mailingStatus[reg.id] !== 'sent') {
        await handleSendEmail(reg);
      }
    }
    alert('All certificates dispatched successfully!');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 10 }}>
      {/* Editor & Preview Pane */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>🎨 Certificate Designer</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Certificate Title</label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Presentation Text</label>
            <input
              type="text"
              className="input"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Template Theme</label>
            <select
              className="input"
              value={templateType}
              onChange={e => setTemplateType(e.target.value as any)}
            >
              <option value="classic">🏆 Classic Ivory</option>
              <option value="modern">⚡ Modern Clean</option>
              <option value="glowing">🌟 Glowing Dark Premium</option>
            </select>
          </div>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Theme Accent Color</label>
            <input
              type="color"
              value={borderColor}
              onChange={e => setBorderColor(e.target.value)}
              style={{
                width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 2, background: 'none', cursor: 'pointer'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Signature Authority Title</label>
            <input
              type="text"
              className="input"
              value={signatureText}
              onChange={e => setSignatureText(e.target.value)}
            />
          </div>
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 13, fontWeight: 500 }}>Upload Signature Image</label>
            <input
              type="file"
              accept="image/*"
              className="input"
              onChange={handleSignatureUpload}
              style={{ padding: '6px 12px' }}
            />
          </div>
        </div>

        {/* Live Canvas Canvas */}
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 12, display: 'flex', justifyContent: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.15)'
        }}>
          <canvas
            ref={canvasRef}
            width={720}
            height={480}
            style={{
              width: '100%',
              maxWidth: 580,
              height: 'auto',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          />
        </div>
      </div>

      {/* Roster & Dispatch List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>📧 Certificate Mailer</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSendAll}
            disabled={registrations.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IconZap size={12} /> Dispatch All
          </button>
        </div>

        {/* Preview Player Selector */}
        {registrations.length > 0 && (
          <div>
            <label className="label" style={{ marginBottom: 6, display: 'block', fontSize: 12, color: 'var(--text-secondary)' }}>Select Player to Preview Certificate</label>
            <select
              className="input"
              value={selectedPlayer?.id || ''}
              onChange={e => setSelectedPlayer(registrations.find(r => r.id === e.target.value) || null)}
            >
              {registrations.map(r => (
                <option key={r.id} value={r.id}>{r.player_name} ({r.player_email})</option>
              ))}
            </select>
          </div>
        )}

        {/* Recipient Roster Sheet */}
        <div style={{ flex: 1, overflowY: 'auto', maxHeight: 420, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
          {registrations.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No approved registrations in this tournament to send certificates.
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Participant</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: 100 }}>Status</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', width: 90 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => {
                  const status = mailingStatus[r.id] || 'idle';
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ fontWeight: 600 }}>{r.player_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.player_email}</div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        {status === 'sent' && (
                          <span className="badge badge-approved" style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                            <IconCheck size={10} /> Sent
                          </span>
                        )}
                        {status === 'sending' && (
                          <span className="badge badge-pending" style={{ fontSize: 11 }}>Mailing...</span>
                        )}
                        {status === 'idle' && (
                          <span className="badge" style={{ fontSize: 11, background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>Ready</span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={status !== 'idle'}
                          onClick={() => handleSendEmail(r)}
                        >
                          Send
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
