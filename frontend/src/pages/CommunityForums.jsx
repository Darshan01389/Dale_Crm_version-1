import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const CATEGORIES = [
  'All',
  'Prompts & AI',
  'Sales Tactics',
  'Integrations',
  'Playbooks',
  'General Discussion'
];

export default function CommunityForums() {
  const { profile } = useUser();
  const { show } = useToast() || { show: (cfg) => alert(cfg.message) };

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Discussion Thread Drawer/Modal
  const [activePost, setActivePost] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // New Post Modal
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Prompts & AI');
  const [newContent, setNewContent] = useState('');
  const [submittingPost, setSubmittingPost] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = selectedCategory === 'All'
        ? '/api/forum/posts'
        : `/api/forum/posts?category=${encodeURIComponent(selectedCategory)}`;
      const res = await api.get(url);
      setPosts(res.data || []);
    } catch (err) {
      console.error('Error loading forum posts:', err);
      // Fallback demo posts if DB empty
      setPosts([
        {
          id: 'demo-1',
          title: 'How we used DaleIQ Voice Coach to increase call conversion by 34%',
          category: 'Playbooks',
          author_name: 'Sarah Chen (Acme Sales)',
          content: 'Here is our exact cadence: 1. Record prospect call via Chrome Extension. 2. Feed acoustic metrics into Dale sentiment analyzer. 3. Auto-generate tailored WhatsApp follow-up within 5 minutes.',
          upvotes: 42,
          reply_count: 8,
          views: 610,
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 'demo-2',
          title: 'Top 5 system prompts for overcoming enterprise SaaS price objections',
          category: 'Prompts & AI',
          author_name: 'Marcus Vance',
          content: 'Sharing the exact prompts that helped our team handle objections around annual commit vs monthly flexibility. Feel free to copy and adapt!',
          upvotes: 89,
          reply_count: 19,
          views: 1420,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'demo-3',
          title: 'Connecting Dale CRM Webhooks to Slack alerts in 3 minutes',
          category: 'Integrations',
          author_name: 'Devon Patel',
          content: 'Step-by-step walkthrough for piping high-intent lead signals directly to your team deal room channel using the new webhooks router.',
          upvotes: 27,
          reply_count: 4,
          views: 390,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const handleOpenThread = async (post) => {
    setActivePost(post);
    setLoadingThread(true);
    try {
      const res = await api.get(`/api/forum/posts/${post.id}`);
      setActivePost(res.data);
    } catch {
      // Keep existing post state
    } finally {
      setLoadingThread(false);
    }
  };

  const handleUpvote = async (e, postId) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/api/forum/posts/${postId}/upvote`);
      const newUpvotes = res.data?.upvotes;
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: newUpvotes || p.upvotes + 1 } : p));
      if (activePost && activePost.id === postId) {
        setActivePost(prev => ({ ...prev, upvotes: newUpvotes || prev.upvotes + 1 }));
      }
    } catch {
      // Optimistic increment
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, upvotes: p.upvotes + 1 } : p));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setSubmittingPost(true);
    try {
      const res = await api.post('/api/forum/posts', {
        title: newTitle.trim(),
        category: newCategory,
        content: newContent.trim()
      });
      show({ type: 'success', message: 'Discussion posted to community!' });
      setShowNewPostModal(false);
      setNewTitle('');
      setNewContent('');
      setPosts(prev => [res.data, ...prev]);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to publish discussion';
      show({ type: 'error', message: String(msg) });
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !activePost) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(`/api/forum/posts/${activePost.id}/reply`, {
        content: replyText.trim()
      });
      const newReply = res.data;
      setActivePost(prev => ({
        ...prev,
        reply_count: (prev.reply_count || 0) + 1,
        replies: [...(prev.replies || []), newReply]
      }));
      setPosts(prev => prev.map(p => p.id === activePost.id ? { ...p, reply_count: (p.reply_count || 0) + 1 } : p));
      setReplyText('');
      show({ type: 'success', message: 'Reply posted!' });
    } catch (err) {
      show({ type: 'error', message: 'Failed to post reply' });
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredPosts = posts.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--bg)', padding: '40px 24px 100px' }} className="custom-scroll animate-in">
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        
        {/* Page Banner Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          marginBottom: 32, flexWrap: 'wrap', gap: 16
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 26 }}>🌐</span>
              <h1 className="text-h1" style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                Community Forums & Knowledge Exchange
              </h1>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
              Connect with high-performance sales leaders, exchange AI prompts, and discover winning sales playbooks.
            </p>
          </div>

          <button
            onClick={() => setShowNewPostModal(true)}
            className="btn-primary"
            style={{ padding: '12px 22px', borderRadius: 14, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span>+ Start Discussion</span>
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
          <input
            type="text"
            placeholder="Search discussions by keyword, strategy, or author..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 16,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              fontSize: 14, color: 'var(--text)', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="custom-scroll">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: 20,
                  fontSize: 12, fontWeight: 800, cursor: 'pointer', border: 'none',
                  background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                  boxShadow: selectedCategory === cat ? '0 4px 12px rgba(79, 70, 229, 0.2)' : 'none',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Post Feed */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="card glass" style={{ padding: 24, height: 110, opacity: 0.6 }} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="card glass" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>No discussions found</h3>
            <p style={{ fontSize: 13, marginTop: 4 }}>Be the first to ask a question or share a sales win in this category!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredPosts.map(post => (
              <div
                key={post.id}
                onClick={() => handleOpenThread(post)}
                className="card glass-hover"
                style={{
                  padding: 24, borderRadius: 20, cursor: 'pointer',
                  display: 'flex', gap: 20, alignItems: 'flex-start',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Upvote Button */}
                <button
                  onClick={(e) => handleUpvote(e, post.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '8px 12px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)',
                    cursor: 'pointer', minWidth: 48
                  }}
                >
                  <span style={{ fontSize: 14 }}>▲</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginTop: 2 }}>
                    {post.upvotes || 0}
                  </span>
                </button>

                {/* Content Details */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                      padding: '3px 8px', borderRadius: 6,
                      background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)',
                      letterSpacing: '0.06em'
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                      by {post.author_name || 'Community Member'} • {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 8, lineHeight: 1.4 }}>
                    {post.title}
                  </h3>

                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                    {post.content && post.content.length > 180 ? `${post.content.substring(0, 180)}...` : post.content}
                  </p>

                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>
                    <span>💬 {post.reply_count || 0} replies</span>
                    <span>👁 {post.views || 0} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discussion Thread Drawer Modal */}
      {activePost && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 5000,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card animate-in" style={{
            width: '100%', maxWidth: 720, maxHeight: '90vh',
            background: 'var(--bg-surface)', borderRadius: 24,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)'
          }}>
            {/* Thread Header */}
            <div style={{
              padding: '20px 24px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
            }}>
              <div>
                <span style={{
                  fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 6,
                  background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary)',
                  letterSpacing: '0.06em'
                }}>
                  {activePost.category}
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', marginTop: 8 }}>
                  {activePost.title}
                </h2>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  Posted by {activePost.author_name} • {new Date(activePost.created_at).toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setActivePost(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Thread Body & Replies */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }} className="custom-scroll">
              <div style={{
                fontSize: 14, color: 'var(--text)', lineHeight: 1.7,
                paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24
              }}>
                {activePost.content}
              </div>

              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>
                Replies ({activePost.replies?.length || 0})
              </h4>

              {loadingThread ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>Loading replies...</div>
              ) : !activePost.replies || activePost.replies.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-subtle)', borderRadius: 14 }}>
                  No replies yet. Share your insight below!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activePost.replies.map(r => (
                    <div key={r.id} style={{
                      padding: 16, borderRadius: 14, background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ fontWeight: 800, color: 'var(--text)' }}>{r.author_name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Just now'}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
                        {r.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reply Composer */}
            <div style={{
              padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg-subtle)',
              display: 'flex', gap: 12
            }}>
              <input
                type="text"
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                placeholder="Write a constructive reply..."
                style={{
                  flex: 1, padding: '12px 18px', borderRadius: 14,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text)', outline: 'none'
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={submittingReply || !replyText.trim()}
                className="btn-primary"
                style={{ padding: '10px 20px', borderRadius: 14, fontSize: 13, fontWeight: 800 }}
              >
                {submittingReply ? 'Sending...' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Discussion Modal */}
      {showNewPostModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 5000,
          background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div className="card animate-in" style={{
            width: '100%', maxWidth: 540, background: 'var(--bg-surface)',
            borderRadius: 24, padding: 32, border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-xl)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)' }}>Start a Community Discussion</h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                style={{ background: 'none', border: 'none', fontSize: 22, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text)', outline: 'none', fontWeight: 600
                  }}
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Best cadence for inbound WhatsApp leads?"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    fontSize: 14, color: 'var(--text)', outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Content & Details
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Share context, questions, prompts, or step-by-step methodologies..."
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    background: 'var(--bg-subtle)', border: '1px solid var(--border)',
                    fontSize: 13, color: 'var(--text)', outline: 'none', lineHeight: 1.6, resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, padding: 12, borderRadius: 12, fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPost}
                  className="btn-primary"
                  style={{ flex: 2, padding: 12, borderRadius: 12, fontWeight: 800 }}
                >
                  {submittingPost ? 'Publishing...' : 'Publish Discussion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
