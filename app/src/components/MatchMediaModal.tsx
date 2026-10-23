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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Active playing video / lightbox image
  const [activeVideoEmbedUrl, setActiveVideoEmbedUrl] = useState<string | null>(null);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string | null>(null);

  // Full-screen viewer state: holds the index in `media` currently viewed in full-screen
  const [fullScreenIndex, setFullScreenIndex] = useState<number | null>(null);

  // Keyboard navigation for full-screen viewer
  useEffect(() => {
    if (fullScreenIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFullScreenIndex(null);
      } else if (e.key === 'ArrowRight') {
        setFullScreenIndex(prev => (prev !== null && prev < media.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowLeft') {
        setFullScreenIndex(prev => (prev !== null && prev > 0 ? prev - 1 : media.length - 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullScreenIndex, media.length]);

  // Clean up object URLs on unmount or file reset
  useEffect(() => {
    return () => {
      filePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [filePreviews]);

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

  const handleFilesSelected = (filesList: FileList | File[]) => {
    const rawFiles = Array.from(filesList);
    const validImageFiles = rawFiles.filter(f => f.type.startsWith('image/'));

    if (validImageFiles.length === 0) {
      setUploadError('Please select valid image files (PNG, JPG, WebP).');
      return;
    }

    // Limit to max 10 photos
    const newTotal = selectedFiles.length + validImageFiles.length;
    if (newTotal > 10) {
      setUploadError(`You can upload a maximum of 10 photos at a time (selected ${newTotal}).`);
    } else {
      setUploadError('');
    }

    const allowed = validImageFiles.slice(0, Math.max(0, 10 - selectedFiles.length));
    const combinedFiles = [...selectedFiles, ...allowed];
    const newPreviews = allowed.map(f => URL.createObjectURL(f));

    setSelectedFiles(combinedFiles);
    setFilePreviews(prev => [...prev, ...newPreviews]);
    setRemoteUrl('');
  };

  const removeSelectedFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
    setUploadError('');
  };

  const clearAllSelectedFiles = () => {
    filePreviews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setFilePreviews([]);
    setUploadError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError('');
    setUploadProgressText('');

    if (uploadType === 'photo' && selectedFiles.length === 0 && !remoteUrl) {
      setUploadError('Please choose at least one image file or paste an image URL.');
      return;
    }
    if (uploadType === 'video' && !youtubeUrl) {
      setUploadError('Please enter a YouTube video or stream link.');
      return;
    }

    try {
      setUploading(true);

      if (uploadType === 'photo') {
        if (selectedFiles.length > 0) {
          const total = selectedFiles.length;
          const newlyUploaded: TournamentMedia[] = [];

          for (let i = 0; i < total; i++) {
            const currentFile = selectedFiles[i];
            setUploadProgressText(`Uploading ${i + 1} of ${total} photos...`);
            const webpFile = await compressImageToWebP(currentFile);
            const fileUrl = await uploadToSupabaseStorage(webpFile, 'media');

            const payload = {
              tournament_id: match.tournament_id || undefined,
              file_url: fileUrl,
              caption: caption.trim() || undefined,
              media_type: 'image' as const,
            };

            const saved = await uploadMatchMedia(match.id, payload);
            newlyUploaded.push(saved);
          }

          setMedia(prev => [...newlyUploaded, ...prev]);
        } else {
          // Single remote URL upload
          setUploadProgressText('Saving image...');
          const payload = {
            tournament_id: match.tournament_id || undefined,
            file_url: remoteUrl,
            caption: caption.trim() || undefined,
            media_type: 'image' as const,
          };
          const saved = await uploadMatchMedia(match.id, payload);
          setMedia(prev => [saved, ...prev]);
        }
      } else {
        const embed = getYouTubeEmbedUrl(youtubeUrl);
        if (!embed) {
          setUploadError('Invalid YouTube URL. Please use standard, mobile, or live link format.');
          setUploading(false);
          return;
        }
        setUploadProgressText('Saving video link...');
        const payload = {
          tournament_id: match.tournament_id || undefined,
          file_url: youtubeUrl,
          caption: caption.trim() || undefined,
          media_type: 'video' as const,
        };
        const newMedia = await uploadMatchMedia(match.id, payload);
        setMedia(prev => [newMedia, ...prev]);
        setActiveVideoEmbedUrl(getYouTubeEmbedUrl(youtubeUrl));
      }

      // Reset Form
      setCaption('');
      setRemoteUrl('');
      setYoutubeUrl('');
      clearAllSelectedFiles();
    } catch (err: any) {
      console.error('Failed to upload match media:', err);
      const msg = err?.message || 'Failed to save media.';
      setUploadError(msg.length > 100 ? 'Failed to save media. Please try again.' : msg);
    } finally {
      setUploading(false);
      setUploadProgressText('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {match.sport === 'cricket' && (
              <a
                href={`/overlay/cricket?matchId=${match.id}&theme=ipl&position=bottom`}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.4)',
                }}
              >
                📡 OBS / Live Overlay
              </a>
            )}
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={onClose} 
              style={{ color: '#94a3b8', fontSize: 20 }}
            >✕</button>
          </div>
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
                <button
                  onClick={() => {
                    const idx = media.findIndex(m => getYouTubeEmbedUrl(m.file_url) === activeVideoEmbedUrl);
                    setFullScreenIndex(idx !== -1 ? idx : 0);
                  }}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 10,
                    border: 'none',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    backdropFilter: 'blur(4px)',
                    zIndex: 2,
                  }}
                  title="View in full screen"
                >
                  ⛶ Full Screen
                </button>
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
                  style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                  onClick={() => {
                    const idx = media.findIndex(m => m.file_url === activePhotoUrl);
                    setFullScreenIndex(idx !== -1 ? idx : 0);
                  }}
                />
                <div style={{ position: 'absolute', right: 10, top: 10, display: 'flex', gap: 6, zIndex: 2 }}>
                  <button 
                    onClick={() => {
                      const idx = media.findIndex(m => m.file_url === activePhotoUrl);
                      setFullScreenIndex(idx !== -1 ? idx : 0);
                    }} 
                    style={{ border: 'none', background: 'rgba(37, 99, 235, 0.85)', color: '#fff', borderRadius: 4, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    ⛶ Full Screen
                  </button>
                  <button 
                    onClick={() => setActivePhotoUrl(null)} 
                    style={{ border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 4, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}
                  >✕ Close</button>
                </div>
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
                {media.length > 0 && (
                  <button
                    onClick={() => setFullScreenIndex(0)}
                    style={{
                      marginTop: 10,
                      background: 'rgba(37, 99, 235, 0.2)',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      color: '#60a5fa',
                      borderRadius: 6,
                      padding: '6px 14px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⛶ View Gallery Full Screen ({media.length} items)
                  </button>
                )}
              </div>
            )}

            {/* Media Gallery Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#f1f5f9' }}>Gallery Items</h4>
                {media.length > 0 && (
                  <button
                    onClick={() => {
                      if (activePhotoUrl) {
                        const idx = media.findIndex(m => m.file_url === activePhotoUrl);
                        setFullScreenIndex(idx !== -1 ? idx : 0);
                      } else if (activeVideoEmbedUrl) {
                        const idx = media.findIndex(m => getYouTubeEmbedUrl(m.file_url) === activeVideoEmbedUrl);
                        setFullScreenIndex(idx !== -1 ? idx : 0);
                      } else {
                        setFullScreenIndex(0);
                      }
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--accent)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 6px',
                    }}
                  >
                    ⛶ Open Full Screen
                  </button>
                )}
              </div>
              {loading ? (
                <p style={{ fontSize: 12, color: '#64748b' }}>Loading media...</p>
              ) : media.length === 0 ? (
                <p style={{ fontSize: 12, color: '#64748b' }}>No media uploaded for this match yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                  {media.map((item, mIdx) => {
                    const isVideo = item.media_type === 'video' || getYouTubeEmbedUrl(item.file_url);
                    const thumb = isVideo ? getYouTubeThumbnail(item.file_url) : item.file_url;
                    const isSelected = (!isVideo && activePhotoUrl === item.file_url) || (isVideo && activeVideoEmbedUrl === getYouTubeEmbedUrl(item.file_url));
                    
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
                          // Also allow double-click or directly open full screen on second click
                          setFullScreenIndex(mIdx);
                        }}
                        style={{
                          position: 'relative',
                          aspectRatio: '4/3',
                          borderRadius: 6,
                          overflow: 'hidden',
                          border: isSelected ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.1)',
                          cursor: 'pointer',
                          background: '#000',
                          transition: 'border 0.2s, transform 0.2s'
                        }}
                        onMouseOver={e => {
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.transform = 'scale(1.03)';
                        }}
                        onMouseOut={e => {
                          e.currentTarget.style.borderColor = isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.1)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title={`Click to open full screen: ${item.caption || (isVideo ? 'Video' : 'Photo')}`}
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
                        <div
                          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onDrop={e => {
                            e.preventDefault();
                            setDragOver(false);
                            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                              handleFilesSelected(e.dataTransfer.files);
                            }
                          }}
                          onClick={() => {
                            if (selectedFiles.length < 10) {
                              document.getElementById('match-file-input')?.click();
                            }
                          }}
                          style={{
                            border: dragOver ? '2px dashed var(--accent)' : '2px dashed rgba(255,255,255,0.15)',
                            borderRadius: 8,
                            padding: filePreviews.length > 0 ? '14px 10px' : '22px 12px',
                            textAlign: 'center',
                            background: dragOver ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                            cursor: selectedFiles.length >= 10 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            id="match-file-input" 
                            type="file" 
                            multiple
                            accept="image/*" 
                            style={{ display: 'none' }} 
                            onChange={handleFileChange} 
                            disabled={selectedFiles.length >= 10}
                          />
                          <div style={{ fontSize: 22, marginBottom: 2 }}>📸</div>
                          <span style={{ fontSize: 12, fontWeight: 500, display: 'block' }}>
                            {selectedFiles.length >= 10 ? (
                              <span style={{ color: '#f59e0b' }}>Maximum 10 photos selected</span>
                            ) : (
                              <>
                                Drag photos here or <span style={{ color: 'var(--accent)', textDecoration: 'underline' }}>browse</span>
                              </>
                            )}
                          </span>
                          <span style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginTop: 3 }}>
                            Upload up to 10 photos at once (PNG, JPG, WebP)
                          </span>
                        </div>

                        {/* Selected Previews Grid */}
                        {filePreviews.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>
                                Selected Photos ({filePreviews.length} / 10)
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); clearAllSelectedFiles(); }}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#f87171',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  padding: '2px 6px',
                                  textDecoration: 'underline'
                                }}
                              >
                                Clear all
                              </button>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(5, 1fr)',
                              gap: 6,
                              maxHeight: 150,
                              overflowY: 'auto',
                              padding: 4,
                              background: 'rgba(0,0,0,0.25)',
                              borderRadius: 8,
                              border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                              {filePreviews.map((previewUrl, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    position: 'relative',
                                    aspectRatio: '1',
                                    borderRadius: 6,
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    background: '#0f172a'
                                  }}
                                >
                                  <img
                                    src={previewUrl}
                                    alt={`Selected ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeSelectedFile(idx);
                                    }}
                                    title="Remove photo"
                                    style={{
                                      position: 'absolute',
                                      top: 3,
                                      right: 3,
                                      background: 'rgba(239,68,68,0.92)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: 18,
                                      height: 18,
                                      fontSize: 10,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                      lineHeight: 1
                                    }}
                                  >
                                    ✕
                                  </button>
                                  <div style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    background: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    fontSize: 9,
                                    textAlign: 'center',
                                    padding: '1px 0'
                                  }}>
                                    #{idx + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
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
                          onChange={e => { setRemoteUrl(e.target.value); clearAllSelectedFiles(); }}
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
                    {uploading 
                      ? (uploadProgressText || 'Uploading...') 
                      : (uploadType === 'photo' && selectedFiles.length > 1 
                          ? `Publish ${selectedFiles.length} Photos` 
                          : 'Publish Media')}
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

      {/* FULL-SCREEN IMMERSIVE MEDIA LIGHTBOX */}
      {fullScreenIndex !== null && media[fullScreenIndex] && (() => {
        const currentItem = media[fullScreenIndex];
        const isVideo = currentItem.media_type === 'video' || getYouTubeEmbedUrl(currentItem.file_url);
        const embedUrl = isVideo ? getYouTubeEmbedUrl(currentItem.file_url) : null;
        const totalItems = media.length;

        const handleNext = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setFullScreenIndex((fullScreenIndex + 1) % totalItems);
        };

        const handlePrev = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setFullScreenIndex((fullScreenIndex - 1 + totalItems) % totalItems);
        };

        return (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              background: 'rgba(0, 0, 0, 0.96)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              flexDirection: 'column',
              userSelect: 'none',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={() => setFullScreenIndex(null)}
          >
            {/* Top Toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 24px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0))',
                zIndex: 10,
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '3px 10px', borderRadius: 20 }}>
                  {isVideo ? '🎥 VIDEO' : '📷 PHOTO'}
                </span>
                <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {fullScreenIndex + 1} / {totalItems}
                </span>
                {currentItem.caption && (
                  <span style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 600, maxWidth: 450, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentItem.caption}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, color: '#64748b', display: 'none' }}>Use ← → keys or swipe</span>
                <button
                  onClick={() => setFullScreenIndex(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    fontSize: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                  title="Close Full Screen (Esc)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Main Full-Screen Media Viewport */}
            <div
              style={{
                flex: 1,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 60px',
                minHeight: 0,
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Previous Button */}
              {totalItems > 1 && (
                <button
                  onClick={handlePrev}
                  style={{
                    position: 'absolute',
                    left: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    fontSize: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 20,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    transition: 'transform 0.2s, background 0.2s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  title="Previous Item (Left Arrow)"
                >
                  ◀
                </button>
              )}

              {/* Media Content */}
              {isVideo && embedUrl ? (
                <div style={{
                  width: '100%',
                  maxWidth: 1100,
                  maxHeight: '80vh',
                  aspectRatio: '16/9',
                  background: '#000',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  position: 'relative',
                }}>
                  <iframe
                    src={`${embedUrl}?autoplay=1`}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : isVideo ? (
                <video
                  src={currentItem.file_url}
                  controls
                  autoPlay
                  style={{
                    maxWidth: '100%',
                    maxHeight: '82vh',
                    borderRadius: 12,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                  }}
                />
              ) : (
                <img
                  src={currentItem.file_url}
                  alt={currentItem.caption || 'Match full view'}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '82vh',
                    objectFit: 'contain',
                    borderRadius: 8,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              )}

              {/* Next Button */}
              {totalItems > 1 && (
                <button
                  onClick={handleNext}
                  style={{
                    position: 'absolute',
                    right: 20,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    fontSize: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 20,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                    transition: 'transform 0.2s, background 0.2s',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                  title="Next Item (Right Arrow)"
                >
                  ▶
                </button>
              )}
            </div>

            {/* Bottom Filmstrip Thumbnails Navigation */}
            <div
              style={{
                padding: '14px 20px',
                background: 'linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                overflowX: 'auto',
                zIndex: 10,
              }}
              onClick={e => e.stopPropagation()}
            >
              {media.map((thumbItem, idx) => {
                const isThumbVideo = thumbItem.media_type === 'video' || getYouTubeEmbedUrl(thumbItem.file_url);
                const thumbSrc = isThumbVideo ? getYouTubeThumbnail(thumbItem.file_url) : thumbItem.file_url;
                const isCurrent = idx === fullScreenIndex;

                return (
                  <div
                    key={`fs-thumb-${thumbItem.id}`}
                    onClick={() => setFullScreenIndex(idx)}
                    style={{
                      width: 60,
                      height: 44,
                      borderRadius: 6,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: isCurrent ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                      opacity: isCurrent ? 1 : 0.5,
                      transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                      position: 'relative',
                      background: '#000',
                    }}
                    onMouseOver={e => {
                      if (!isCurrent) e.currentTarget.style.opacity = '0.9';
                    }}
                    onMouseOut={e => {
                      if (!isCurrent) e.currentTarget.style.opacity = '0.5';
                    }}
                  >
                    <img
                      src={thumbSrc || ''}
                      alt="Thumbnail"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {isThumbVideo && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                        <span style={{ fontSize: 12 }}>▶</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
