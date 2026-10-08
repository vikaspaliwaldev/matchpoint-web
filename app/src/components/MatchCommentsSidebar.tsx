import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MatchComment, MatchPoll, Match } from '@/types';
import {
  getMatchComments,
  postMatchComment,
  deleteMatchComment,
  getMatchPolls,
  createMatchPoll,
  voteInMatchPoll,
  getMatchById
} from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface MatchCommentsSidebarProps {
  matchId: string;
  defaultTab?: 'chat' | 'poll';
}

export default function MatchCommentsSidebar({ matchId, defaultTab }: MatchCommentsSidebarProps) {
  const { user } = useAuth();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'chat' | 'poll'>(defaultTab || 'chat');

  // Sync tab state when defaultTab changes
  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

  // Chat/Commentary states
  const [comments, setComments] = useState<MatchComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [message, setMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [posting, setPosting] = useState(false);
  const [chatError, setChatError] = useState('');
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Poll states
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const [polls, setPolls] = useState<MatchPoll[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Record<string, number>>({}); // pollId -> optionIndex
  const [votingInProgress, setVotingInProgress] = useState<Record<string, boolean>>({});

  // Admin Poll Creation Form States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [creatingPoll, setCreatingPoll] = useState(false);
  const [createPollError, setCreatePollError] = useState('');

  // Dynamically map default option names ('Player 1' / 'Player 2') to actual player names from matchDetails
  const mappedPolls = useMemo(() => {
    if (!matchDetails) return polls;
    return polls.map(p => {
      const updatedOptions = p.options.map(opt => {
        if ((opt === 'Player 1' || opt === 'Player1') && matchDetails.player1_name) {
          return matchDetails.player1_name;
        }
        if ((opt === 'Player 2' || opt === 'Player2') && matchDetails.player2_name) {
          return matchDetails.player2_name;
        }
        return opt;
      });
      return { ...p, options: updatedOptions };
    });
  }, [polls, matchDetails]);

  // Load comments & setup Realtime subscription
  useEffect(() => {
    let active = true;
    
    async function fetchComments() {
      try {
        const data = await getMatchComments(matchId);
        if (active) {
          setComments(data);
          setLoadingComments(false);
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
      console.log('🔄 Supabase not configured. Running comments feed in polling mock mode...');
      const interval = setInterval(fetchComments, 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [matchId]);

  // Load Match Details
  useEffect(() => {
    async function fetchMatch() {
      try {
        const m = await getMatchById(matchId);
        setMatchDetails(m);
        // Pre-fill options with players names when match details load
        if (m) {
          setNewOptions([m.player1_name, m.player2_name]);
        }
      } catch (err) {
        console.error('Failed to load match details:', err);
      }
    }
    fetchMatch();
  }, [matchId]);

  // Load Poll Details & setup Realtime subscription
  useEffect(() => {
    let active = true;

    // Load voted polls from localStorage
    const savedVotes = JSON.parse(localStorage.getItem('voted_polls') || '{}');
    setVotedPolls(savedVotes);

    async function fetchPolls() {
      try {
        const data = await getMatchPolls(matchId);
        if (active) {
          setPolls(data);
          setLoadingPolls(false);
        }
      } catch (err) {
        console.error('Failed to load initial polls:', err);
      }
    }

    fetchPolls();

    if (isSupabaseConfigured) {
      console.log(`🔌 Connecting to Supabase Realtime for polls on match: ${matchId}`);
      
      const channel = supabase
        .channel(`match-polls-${matchId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'match_polls', 
            filter: `match_id=eq.${matchId}` 
          },
          (payload: any) => {
            console.log('⚡ Received real-time poll update:', payload.eventType, payload.new);
            if (active) {
              setPolls(prev => {
                const updated: MatchPoll = {
                  id: payload.new.id,
                  match_id: payload.new.match_id || payload.new.matchId,
                  question: payload.new.question,
                  options: Array.isArray(payload.new.options) ? payload.new.options : JSON.parse(payload.new.options || '[]'),
                  votes: Array.isArray(payload.new.votes) ? payload.new.votes : JSON.parse(payload.new.votes || '[]'),
                  created_at: payload.new.created_at || payload.new.createdAt,
                };
                
                if (payload.eventType === 'INSERT') {
                  if (prev.some(p => p.id === updated.id)) return prev;
                  return [updated, ...prev];
                } else if (payload.eventType === 'UPDATE') {
                  return prev.map(p => p.id === updated.id ? updated : p);
                } else if (payload.eventType === 'DELETE') {
                  return prev.filter(p => p.id !== payload.old.id);
                }
                return prev;
              });
            }
          }
        )
        .subscribe();

      return () => {
        active = false;
        console.log(`🔌 Disconnecting polls realtime channel for match: ${matchId}`);
        supabase.removeChannel(channel);
      };
    } else {
      const interval = setInterval(fetchPolls, 4000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [matchId]);

  // Scroll to bottom on new comments
  useEffect(() => {
    if (activeTab === 'chat') {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, activeTab]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const chosenName = user ? user.name : guestName.trim() || 'Anonymous Spectator';

    try {
      setPosting(true);
      setChatError('');
      
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
      setChatError('Could not post comment. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this commentary comment?')) return;
    try {
      await deleteMatchComment(matchId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Could not delete comment.');
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      setVotingInProgress(prev => ({ ...prev, [pollId]: true }));
      const updatedPoll = await voteInMatchPoll(pollId, optionIndex);
      
      setPolls(prev => prev.map(p => p.id === pollId ? updatedPoll : p));
      
      const nextVoted = { ...votedPolls, [pollId]: optionIndex };
      setVotedPolls(nextVoted);
      localStorage.setItem('voted_polls', JSON.stringify(nextVoted));
    } catch (err) {
      console.error('Failed to register vote:', err);
      alert('Could not record vote. Please try again.');
    } finally {
      setVotingInProgress(prev => ({ ...prev, [pollId]: false }));
    }
  };

  const handleCreatePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatePollError('');

    const question = newQuestion.trim();
    const filteredOptions = newOptions.map(o => o.trim()).filter(o => o.length > 0);

    if (!question) {
      setCreatePollError('Please enter a poll question.');
      return;
    }
    if (filteredOptions.length < 2) {
      setCreatePollError('Please provide at least 2 non-empty options.');
      return;
    }

    try {
      setCreatingPoll(true);
      const newPoll = await createMatchPoll(matchId, question, filteredOptions);
      setPolls(prev => [newPoll, ...prev]);
      
      // Reset form
      setNewQuestion('');
      setNewOptions(matchDetails ? [matchDetails.player1_name, matchDetails.player2_name] : ['', '']);
      setShowCreateForm(false);
    } catch (err) {
      console.error('Failed to create poll:', err);
      setCreatePollError('Failed to create poll. Try again.');
    } finally {
      setCreatingPoll(false);
    }
  };

  const handleAddOptionInput = () => {
    setNewOptions(prev => [...prev, '']);
  };

  const handleRemoveOptionInput = (index: number) => {
    if (newOptions.length <= 2) return;
    setNewOptions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionChange = (index: number, val: string) => {
    setNewOptions(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
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
        .poll-card {
          animation: comment-in 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .poll-option-btn:hover {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: var(--accent) !important;
          transform: translateY(-1px);
        }
        .poll-option-btn:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          🏸 Match Hub
        </h3>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Spectator commentary & predictions
        </p>
      </div>

      {/* Tab Selectors */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.01)' }}>
        <button
          onClick={() => setActiveTab('chat')}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'chat' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'chat' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'chat' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('poll')}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: activeTab === 'poll' ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'poll' ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === 'poll' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          📊 Predictions
        </button>
      </div>

      {/* Main Tab Contents */}
      {activeTab === 'chat' ? (
        <>
          {/* Message Feed */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {loadingComments ? (
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
                      background: isMe ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isMe ? 'rgba(37, 99, 235, 0.2)' : 'var(--border)'}`,
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
                            onClick={() => handleDeleteComment(c.id)}
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

          {/* Chat Input Tray */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
            {chatError && (
              <div style={{ color: 'var(--score-loss)', fontSize: 11, marginBottom: 8, fontWeight: 500 }}>
                ⚠️ {chatError}
              </div>
            )}

            <form onSubmit={handleSubmitComment} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        </>
      ) : (
        /* Predictions Tab */
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
          
          {/* Admin Create Poll Button/Form */}
          {isAdmin && (
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 16, marginBottom: 4 }}>
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn"
                  style={{
                    width: '100%',
                    background: 'rgba(37, 99, 235, 0.08)',
                    border: '1px dashed var(--accent)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: 13,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  ⚡ Add Custom Prediction Poll
                </button>
              ) : (
                <form onSubmit={handleCreatePollSubmit} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }} className="animate-slide-up">
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    🆕 Create New Poll
                  </h4>
                  {createPollError && (
                    <div style={{ color: 'var(--score-loss)', fontSize: 11, fontWeight: 600 }}>
                      ⚠️ {createPollError}
                    </div>
                  )}

                  <div className="input-group">
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Question</label>
                    <input
                      type="text"
                      className="input input-sm"
                      placeholder="e.g. Who wins the next set?"
                      value={newQuestion}
                      onChange={e => setNewQuestion(e.target.value)}
                      required
                      style={{ background: 'var(--bg-primary)' }}
                    />
                  </div>

                  <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Options</label>
                    {newOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input input-sm"
                          placeholder={`Option ${idx + 1}`}
                          value={opt}
                          onChange={e => handleOptionChange(idx, e.target.value)}
                          required
                          style={{ background: 'var(--bg-primary)', flex: 1 }}
                        />
                        {newOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionInput(idx)}
                            style={{
                              border: 'none',
                              background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444',
                              cursor: 'pointer',
                              borderRadius: 4,
                              width: 32,
                              height: 32,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 12
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={handleAddOptionInput}
                      style={{
                        alignSelf: 'flex-start',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      ➕ Add Option
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="submit"
                      disabled={creatingPoll}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '8px 12px', fontSize: 12, height: 36 }}
                    >
                      {creatingPoll ? 'Creating...' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setCreatePollError('');
                      }}
                      className="btn"
                      style={{ flex: 1, padding: '8px 12px', fontSize: 12, height: 36, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Poll Cards List */}
          {loadingPolls || !matchDetails ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 100, color: 'var(--text-muted)' }}>
              <div className="animate-spin" style={{ marginRight: 8 }}>🔄</div> Loading prediction polls...
            </div>
          ) : mappedPolls.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No prediction polls yet</p>
              <span style={{ fontSize: 11, display: 'block', marginTop: 4 }}>Prediction polls appear here as the match is played.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {mappedPolls.map(p => {
                const votedOptionIdx = votedPolls[p.id];
                const hasVotedThisPoll = votedOptionIdx !== undefined;
                
                // Calculate poll values
                const totalVotes = p.votes.reduce((a, b) => a + b, 0);

                return (
                  <div
                    key={p.id}
                    className="poll-card glass-card"
                    style={{
                      padding: 16,
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    {/* Poll Question */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 15 }}>📊</span>
                      <h5 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {p.question}
                      </h5>
                    </div>

                    {!hasVotedThisPoll ? (
                      /* Option Voting Buttons */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {p.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleVote(p.id, idx)}
                            disabled={votingInProgress[p.id]}
                            className="poll-option-btn"
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              background: 'rgba(255,255,255,0.02)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--text-secondary)',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span>{opt}</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>➔</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      /* Poll Results Progress Bars */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {p.options.map((opt, idx) => {
                          const votesCount = p.votes[idx] || 0;
                          const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                          const isUserVote = votedOptionIdx === idx;
                          
                          // Dynamic progressive gradients for result fill bars
                          const gradients = [
                            'linear-gradient(90deg, #10b981, #059669)', // Green
                            'linear-gradient(90deg, #a855f7, #9333ea)', // Purple/Violet
                            'linear-gradient(90deg, #3b82f6, #2563eb)', // Blue
                            'linear-gradient(90deg, #f59e0b, #d97706)', // Yellow/Amber
                            'linear-gradient(90deg, #ec4899, #db2777)', // Pink
                          ];
                          const fillGradient = gradients[idx % gradients.length];

                          return (
                            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                                <span style={{
                                  fontWeight: isUserVote ? 700 : 500,
                                  color: isUserVote ? 'var(--accent)' : 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}>
                                  {opt}
                                  {isUserVote && (
                                    <span style={{
                                      fontSize: 9,
                                      background: 'var(--accent-subtle)',
                                      color: 'var(--accent)',
                                      padding: '1px 4px',
                                      borderRadius: 3,
                                      fontWeight: 700
                                    }}>
                                      YOUR VOTE
                                    </span>
                                  )}
                                </span>
                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {percent}% ({votesCount})
                                </span>
                              </div>
                              {/* Track bar */}
                              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.04)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%',
                                  width: `${percent}%`,
                                  background: fillGradient,
                                  borderRadius: 3,
                                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                        
                        {/* Footer summary */}
                        <div style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          textAlign: 'right',
                          marginTop: 4,
                          borderTop: '1px solid rgba(255,255,255,0.03)',
                          paddingTop: 8
                        }}>
                          Total predictions: {totalVotes}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
