import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const CommunityForums = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { show } = useToast();

  const categories = ['All', 'Announcements', 'Sales Workflows', 'AI Prompt Engineering', 'General Discussion'];

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let url = '/api/forum/posts';
      if (activeCategory !== 'All') {
        url += `?category=${encodeURIComponent(activeCategory)}`;
      }
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('voiceiq_token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      show({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F9FAFB' }}>
      {/* Hero Banner */}
      <div style={{ background: '#0056D2', color: 'white', padding: '40px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px' }}>Dale IQ AI CRM Community</h1>
        <p style={{ fontSize: 18, margin: 0, opacity: 0.9 }}>Connect, collaborate, and share sales intelligence strategies.</p>
      </div>

      <div style={{ display: 'flex', flex: 1, padding: '32px 24px', gap: 32, maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        
        {/* Sidebar */}
        <div style={{ width: 250, flexShrink: 0 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#374151', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  background: activeCategory === c ? '#E0F2FE' : 'transparent',
                  color: activeCategory === c ? '#0284C7' : '#4B5563',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: activeCategory === c ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0 }}>{activeCategory} Discussions</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#0056D2', color: 'white', border: 'none', padding: '10px 20px', 
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14
              }}
            >
              Ask a Question
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading discussions...</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', background: 'white', borderRadius: 12, border: '1px solid #E5E7EB' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>💬</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 8px' }}>No discussions yet</h3>
              <p style={{ color: '#6B7280', margin: 0 }}>Be the first to start a conversation in this category!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {posts.map(post => (
                <div key={post.id} style={{ background: 'white', padding: 24, borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#0284C7', background: '#E0F2FE', padding: '4px 8px', borderRadius: 4, display: 'inline-block', marginBottom: 8 }}>
                        {post.category}
                      </span>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#111827', margin: '0 0 8px', cursor: 'pointer' }}>{post.title}</h3>
                    </div>
                  </div>
                  <p style={{ fontSize: 14, color: '#4B5563', margin: '0 0 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#6B7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: 10 }}>
                        {post.author_name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 500, color: '#374151' }}>{post.author_name}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>💬 {post.reply_count} Replies</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👍 {post.upvotes} Upvotes</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreatePostModal 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={fetchPosts} 
        />
      )}
    </div>
  );
};

const CreatePostModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General Discussion');
  const [submitting, setSubmitting] = useState(false);
  const { show } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('voiceiq_token')}`
        },
        body: JSON.stringify({ title, content, category })
      });
      if (!res.ok) throw new Error('Failed to create post');
      show({ type: 'success', message: 'Discussion posted successfully!' });
      onSuccess();
      onClose();
    } catch (err) {
      show({ type: 'error', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', width: 600, borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Ask a Question or Start a Discussion</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#374151' }}>Category</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}
            >
              <option value="Announcements">Announcements</option>
              <option value="Sales Workflows">Sales Workflows</option>
              <option value="AI Prompt Engineering">AI Prompt Engineering</option>
              <option value="General Discussion">General Discussion</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#374151' }}>Title</label>
            <input 
              type="text" 
              required 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="E.g., How do you structure your outreach prompts?"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14 }}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#374151' }}>Content</label>
            <textarea 
              required 
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Provide more details..."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 14, minHeight: 120, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid #D1D5DB', padding: '10px 16px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={submitting} style={{ background: '#0056D2', color: 'white', border: 'none', padding: '10px 24px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}>
              {submitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommunityForums;
