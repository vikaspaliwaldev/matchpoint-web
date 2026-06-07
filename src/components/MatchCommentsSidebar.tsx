import React, { useState, useEffect, useRef } from 'react';
import { MatchComment } from '@/types';
import { getMatchComments, postMatchComment, deleteMatchComment } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface MatchCommentsSidebarProps {
  matchId: string;
}

export default function MatchCommentsSidebar({ matchId }: MatchCommentsSidebarProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    
    async function fetchComments() {
      try {
        const data = await getMatchComments(matchId);
        if (active) {
          setComments(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load initial comments:', err);
      }
    }

    fetchComments();

    if (isSupabaseConfigured) {
      console.log(`🔌 Connecting to Supabase Realtime for comments on match: ${matchId}`);
      
      const channel = supabase
        .channel(`match-comments-${matchId}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'match_comments', 
            filter: `match_id=eq.${matchId}` 
          },
          (payload: any) => {
            console.log('⚡ Received real-time comment insert:', payload.new);
            const newComment: MatchComment = {
              id: payload.new.id,
              match_id: payload.new.match_id || payload.new.matchId,
              user_id: payload.new.user_id || payload.new.userId || undefined,
              user_name: payload.new.user_name || payload.new.userName,
              message: payload.new.message,
              created_at: payload.new.created_at || payload.new.createdAt,
            };
            if (active) {
              setComments(prev => {
                // Prevent duplicate insertions
                if (prev.some(c => c.id === newComment.id)) {
                  return prev;
                }
                return [...prev, newComment];
              });
            }
          }
        )
        .subscribe();

      return () => {
        active = false;
        console.log(`🔌 Disconnecting comments realtime channel for match: ${matchId}`);
        supabase.removeChannel(channel);
      };
    } else {
      // Fall back to polling for mock mode
      console.log('🔄 Supabase not configured. Running comments feed in polling mock mode...');
      const interval = setInterval(fetchComments, 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [matchId]);

  // Scroll to bottom on new comments
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const chosenName = user ? user.name : guestName.trim() || 'Anonymous Spectator';

    try {
      setPosting(true);
      setError('');
      
      const payload = {
        match_id: matchId,
        user_name: chosenName,
        message: message.trim(),
        user_id: user?.id || undefined,
      };

      const newComment = await postMatchComment(matchId, payload);
      setComments(prev => [...prev, newComment]);
      setMessage('');
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError('Could not post comment. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this commentary comment?')) return;
    try {
      await deleteMatchComment(matchId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Could not delete comment.');
    }
  };

  const isAdmin = user && (user.roles?.includes('admin') || user.role === 'admin');

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'rgba(255, 255, 255, 0.01)',
      backdropFilter: 'blur(8px)',
      borderLeft: '1px solid var(--border)',
      minWidth: 320,
      maxWidth: 420,
    }}>
      <style>{`
        .comment-bubble {
          animation: comment-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes comment-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          💬 Live Match Chat
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Spectator commentary & commentary tracking
        </p>
      </div>

      {/* Message Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            <div className="animate-spin" style={{ marginRight: 8 }}>🔄</div> Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', margin: 'auto' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>Be the first to comment!</p>
            <span style={{ fontSize: 11, display: 'block', marginTop: 4 }}>Share your predictions and support below.</span>
          </div>
        ) : (
          comments.map(c => {
            const isMe = user && c.user_id === user.id;
            return (
              <div
                key={c.id}
                className="comment-bubble"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: isMe ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isMe ? 'rgba(139, 92, 246, 0.2)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 12px',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '90%',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isMe ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {c.user_name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {c.created_at ? new Date(c.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--score-loss)',
                          cursor: 'pointer',
                          fontSize: 10,
                          padding: 0,
                        }}
                        title="Delete Commentary"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4, wordBreak: 'break-word' }}>
                  {c.message}
                </p>
              </div>
            );
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* Input Tray */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
        {error && (
          <div style={{ color: 'var(--score-loss)', fontSize: 11, marginBottom: 8, fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Guest Name input if not logged in */}
          {!user && (
            <input
              type="text"
              className="input input-sm"
              placeholder="Your Name (e.g. Spectator Priya)"
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              style={{ background: 'var(--bg-primary)', fontSize: 12, padding: '6px 10px', height: 32 }}
              maxLength={30}
            />
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              className="input"
              placeholder="Post a cheer or prediction..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              style={{ background: 'var(--bg-primary)', flex: 1 }}
              maxLength={300}
              required
              disabled={posting}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0 16px', height: 42, whiteSpace: 'nowrap' }}
              disabled={posting || !message.trim()}
            >
              {posting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
