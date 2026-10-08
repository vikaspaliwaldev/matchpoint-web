'use client';

import React, { useState, useEffect } from 'react';
import { Match, TournamentMedia } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { getMatchMedia, uploadMatchMedia, deleteMatchMedia, uploadToSupabaseStorage } from '@/lib/supabase-service';

interface MatchMediaModalProps {
  match: Match;
  onClose: () => void;
}

// Extract standard embeddable URL from YouTube link
export function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
  } catch (e) {
    console.error('Failed to parse YouTube URL:', e);
  }
  return null;
}

// Get high-res YouTube video thumbnail
export function getYouTubeThumbnail(url: string): string | null {
  const embedUrl = getYouTubeEmbedUrl(url);
  if (!embedUrl) return null;
  const videoId = embedUrl.substring(embedUrl.lastIndexOf('/') + 1);
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export default function MatchMediaModal({ match, onClose }: MatchMediaModalProps) {
  const { user } = useAuth();
  const [media, setMedia] = useState<TournamentMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  
  // Form state
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [caption, setCaption] = useState('');
  const [remoteUrl, setRemoteUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Active playing video / lightbox image
  const [activeVideoEmbedUrl, setActiveVideoEmbedUrl] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Permission checkers
  const isAdmin = user?.roles?.includes('admin') || false;
  const isUmpire = user?.id === match.umpire_id;
  const isBroadcaster = user?.roles?.includes('broadcaster') || false;
  const canManage = isAdmin || isUmpire || isBroadcaster;

  useEffect(() => {
    async function fetchMedia() {
      try {
        setLoading(true);
        const data = await getMatchMedia(match.id);
        setMedia(data);
        
        // Auto-select the first video to play if any exists
        const firstVideo = data.find(m => m.media_type === 'video' || getYouTubeEmbedUrl(m.file_url));
        if (firstVideo) {
          setActiveVideoEmbedUrl(getYouTubeEmbedUrl(firstVideo.file_url));
        }
      } catch (err) {
        console.error('Failed to load match media:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMedia();
  }, [match.id]);

  const compressImageToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                type: 'image/webp',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          }, 'image/webp', 0.75);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Only image files are supported (PNG, JPG, WebP).');
        return;
      }
      setUploadError('');
      setSelectedFile(file);
      setRemoteUrl('');
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');

    if (uploadType === 'photo' && !selectedFile && !remoteUrl) {
      setUploadError('Please choose a file or paste an image URL.');
      return;
    }
    if (uploadType === 'video' && !youtubeUrl) {
      setUploadError('Please enter a YouTube video or stream link.');
      return;
    }

    try {
      setUploading(true);
      let fileUrl = '';

      if (uploadType === 'photo') {
        if (selectedFile) {
          const webpFile = await compressImageToWebP(selectedFile);
          fileUrl = await uploadToSupabaseStorage(webpFile, 'media');
        } else {
          fileUrl = remoteUrl;
        }
      } else {
        const embed = getYouTubeEmbedUrl(youtubeUrl);
        if (!embed) {
          setUploadError('Invalid YouTube URL. Please use standard, mobile, or live link format.');
          setUploading(false);
          return;
        }
        fileUrl = youtubeUrl;
      }

      const payload = {
        tournament_id: match.tournament_id || undefined,
        file_url: fileUrl,
        caption: caption.trim() || undefined,
        media_type: uploadType === 'photo' ? ('image' as const) : ('video' as const),
      };

      const newMedia = await uploadMatchMedia(match.id, payload);
      setMedia(prev => [newMedia, ...prev]);

      // If video, play it immediately
      if (uploadType === 'video') {
        setActiveVideoEmbedUrl(getYouTubeEmbedUrl(fileUrl));
      }

      // Reset
      setCaption('');
      setRemoteUrl('');
      setYoutubeUrl('');
      setSelectedFile(null);
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
        setFilePreview(null);
      }
    } catch (err: any) {
      console.error('Failed to upload match media:', err);
      const msg = err?.message || 'Failed to save media.';
      setUploadError(msg.length > 100 ? 'Failed to save media. Please try again.' : msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      await deleteMatchMedia(match.id, mediaId);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error('Failed to delete media:', err);
      alert('Failed to delete media item.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ 
          maxWidth: 950, 
          width: '95%', 
          maxHeight: '90vh', 
          overflowY: 'auto', 
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: 24,
          borderRadius: 16
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)', margin: 0, textShadow: '0 0 10px rgba(34,197,94,0.15)' }}>
              🎥 Match Media Hub
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, margin: 0 }}>
              {match.player1_name} vs {match.player2_name} {match.court ? `· ${match.court}` : ''}
            </p>
          </div>
          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onClose} 
            style={{ color: '#94a3b8', fontSize: 20 }}
          >✕</button>
        </div>

        {/* Dynamic Media Section Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          
          {/* LEFT: Live Video Player / Image Viewport */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeVideoEmbedUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                paddingTop: '56.25%', // 16:9 Aspect Ratio
                background: '#020617',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <iframe
                  src={`${activeVideoEmbedUrl}?autoplay=1&mute=1`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activePhotoUrl ? (
              <div style={{
                position: 'relative',
                width: '100%',
                height: 240,
                background: '#020617',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <img 
                  src={activePhotoUrl} 
                  alt="Active match view" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                />
                <button 
                  onClick={() => setActivePhotoUrl(null)} 
                  style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                >✕ Close Image</button>
              </div>
            ) : (
              <div style={{
                height: 240,
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: '#64748b',
                border: '1px dashed rgba(255,255,255,0.08)'
              }}>
                <span style={{ fontSize: 36, marginBottom: 8 }}>🎥</span>
                <p style={{ margin: 0, fontSize: 13 }}>No active video or image selected</p>
              </div>
            )}

            {/* Media Gallery Grid */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#f1f5f9' }}>Gallery Items</h4>
              {loading ? (
                <p style={{ fontSize: 12, color: '#64748b' }}>Loading media...</p>
              ) : media.length === 0 ? (
                <p style={{ fontSize: 12, color: '#64748b' }}>No media uploaded for this match yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                  {media.map(item => {
                    const isVideo = item.media_type === 'video' || getYouTubeEmbedUrl(item.file_url);
                    const thumb = isVideo ? getYouTubeThumbnail(item.file_url) : item.file_url;
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => {
                          if (isVideo) {
                            setActiveVideoEmbedUrl(getYouTubeEmbedUrl(item.file_url));
                            setActivePhotoUrl(null);
                          } else {
                            setActivePhotoUrl(item.file_url);
                            setActiveVideoEmbedUrl(null);
                          }
                        }}
                        style={{
                          position: 'relative',
                          aspectRatio: '4/3',
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: '2px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          background: '#000',
                          transition: 'border 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                      >
                        <img 
                          src={thumb || ''} 
                          alt={item.caption || 'Thumbnail'} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                        {isVideo && (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }}>
                            <span style={{ fontSize: 18 }}>▶</span>
                          </div>
                        )}
                        {canManage && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              background: 'rgba(239,68,68,0.9)',
                              border: 'none',
                              borderRadius: '50%',
                              width: 16,
                              height: 16,
                              color: '#fff',
                              fontSize: 9,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Delete"
                          >✕</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Upload/Management Panel (Conditionally Shown for Admins/Umpires) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {canManage ? (
              <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', borderRadius: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, color: '#f1f5f9' }}>
                  Add Match Media
                </h3>

                {uploadError && (
                  <div style={{ fontSize: 12, color: 'var(--score-loss)', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
                    ⚠️ {uploadError}
                  </div>
                )}

                <div className="tab-group" style={{ display: 'flex', marginBottom: 14 }}>
                  <button 
                    type="button" 
                    className={`tab ${uploadType === 'photo' ? 'active' : ''}`}
                    onClick={() => setUploadType('photo')}
                    style={{ flex: 1, textTransform: 'capitalize', fontSize: 12 }}
                  >📷 Photo</button>
                  <button 
                    type="button" 
                    className={`tab ${uploadType === 'video' ? 'active' : ''}`}
                    onClick={() => setUploadType('video')}
                    style={{ flex: 1, textTransform: 'capitalize', fontSize: 12 }}
                  >📺 YouTube Link</button>
                </div>

                <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {uploadType === 'photo' ? (
                    <>
                      {/* Drag and drop zone */}
                      <div className="input-group">
                        {!filePreview ? (
                          <div
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => {
                              e.preventDefault();
                              setDragOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith('image/')) {
                                setSelectedFile(file);
                                setFilePreview(URL.createObjectURL(file));
                              }
                            }}
                            onClick={() => document.getElementById('match-file-input')?.click()}
                            style={{
                              border: dragOver ? '2px dashed var(--accent)' : '2px dashed rgba(255,255,255,0.15)',
                              borderRadius: 8,
                              padding: '24px 12px',
                              textAlign: 'center',
                              background: dragOver ? 'rgba(34,197,94,0.1)' : 'transparent',
                              cursor: 'pointer'
                            }}
                          >
                            <input 
                              id="match-file-input" 
                              type="file" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={handleFileChange} 
                            />
                            <span style={{ fontSize: 24, display: 'block', marginBottom: 4 }}>📁</span>
                            <span style={{ fontSize: 12 }}>Drag image file here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span></span>
                          </div>
                        ) : (
                          <div style={{ position: 'relative', height: 100, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                            <img src={filePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            <button 
                              type="button" 
                              onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                              style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 10, cursor: 'pointer' }}
                            >✕</button>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ fontSize: 10, color: '#64748b' }}>OR</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      </div>

                      {/* Remote URL */}
                      <div className="input-group">
                        <label className="input-label" htmlFor="remote-url-input" style={{ fontSize: 12, color: '#cbd5e1' }}>Or Image URL</label>
                        <input
                          id="remote-url-input"
                          type="url"
                          className="input"
                          placeholder="https://example.com/photo.jpg"
                          value={remoteUrl}
                          onChange={e => { setRemoteUrl(e.target.value); setSelectedFile(null); setFilePreview(null); }}
                          style={{ height: 36, fontSize: 12 }}
                        />
                      </div>
                    </>
                  ) : (
                    /* YouTube link */
                    <div className="input-group">
                      <label className="input-label" htmlFor="youtube-url-input" style={{ fontSize: 12, color: '#cbd5e1' }}>YouTube URL / Live Link</label>
                      <input
                        id="youtube-url-input"
                        type="url"
                        className="input"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={e => setYoutubeUrl(e.target.value)}
                        style={{ height: 36, fontSize: 12 }}
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="match-caption-input" style={{ fontSize: 12, color: '#cbd5e1' }}>Caption / Title</label>
                    <input
                      id="match-caption-input"
                      type="text"
                      className="input"
                      placeholder="High rally rally smash..."
                      value={caption}
                      onChange={e => setCaption(e.target.value)}
                      style={{ height: 36, fontSize: 12 }}
                      maxLength={100}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: 38, fontSize: 13, marginTop: 6 }}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Publish Media'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 18, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.01)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: 'var(--accent)' }}>📢 Spectator Mode</h4>
                <p style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.5, margin: 0 }}>
                  You are viewing the official media updates for this match. 
                  Only the assigned tournament **Admins** or the **Official Umpire** can upload live action photos or match streaming links.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
