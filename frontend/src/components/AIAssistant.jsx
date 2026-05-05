import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, ChevronDown, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your DaleIQ Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [showFileMove, setShowFileMove] = useState(false);
  const scrollRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowAnimation(true);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, history: messages }),
      });
      const data = await response.json();
      
      // Sequence: Search on watch -> File Move -> Response
      setTimeout(() => {
        setShowFileMove(true);
        
        setTimeout(() => {
          setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
          setLoading(false);
          setShowFileMove(false);
          setTimeout(() => setShowAnimation(false), 500);
        }, 800); // Duration of file move animation
      }, 2500); 

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      setLoading(false);
      setShowAnimation(false);
      setShowFileMove(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
      {/* Background Blur Overlay for the whole screen when assistant is active & loading */}
      <AnimatePresence>
        {isOpen && loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(8px)',
              zIndex: -1,
              pointerEvents: 'none'
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="glass"
              style={{
                width: 380,
                height: 540,
                borderRadius: 24,
                boxShadow: 'var(--shadow-xl)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                marginBottom: 16,
                border: '1px solid var(--border)',
                position: 'relative'
              }}
            >
              {/* Animated Salesperson Overlay */}
              <AnimatePresence>
                {showAnimation && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 100,
                      background: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: loading ? 'blur(10px)' : 'none',
                      borderRadius: 24,
                      pointerEvents: 'none'
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <video 
                        ref={videoRef}
                        src="/salesperson.mp4" 
                        style={{ 
                          width: '100%', height: '100%', objectFit: 'contain',
                          mixBlendMode: 'multiply', // Makes a white background transparent
                          filter: 'contrast(1.1)'
                        }}
                        muted
                        playsInline
                      />
                      
                      {/* File Moving Animation */}
                      <AnimatePresence>
                        {showFileMove && (
                          <motion.div
                            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                            animate={{ 
                              x: 100, 
                              y: 200, 
                              scale: 0.2, 
                              opacity: 0,
                              rotate: 45
                            }}
                            transition={{ duration: 0.8, ease: "backIn" }}
                            style={{
                              position: 'absolute',
                              top: '40%',
                              left: '45%',
                              width: 60,
                              height: 60,
                              background: 'var(--primary)',
                              borderRadius: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 0 30px var(--primary-glow)',
                              color: 'white',
                              zIndex: 110
                            }}
                          >
                            <FileText size={32} />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div style={{
                        position: 'absolute',
                        bottom: 40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        color: 'var(--text)',
                        fontWeight: 800,
                        fontSize: 14,
                        textAlign: 'center',
                        width: '80%',
                        background: 'rgba(255,255,255,0.8)',
                        padding: '8px 16px',
                        borderRadius: 12,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {showFileMove ? "Insight Delivering..." : "Searching deal logs..."}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Header */}
              <div style={{
                padding: '20px',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: 12, overflow: 'hidden',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <img src="/salesperson_icon.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="AI" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>DaleIQ AI</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                      <span style={{ fontSize: 11, opacity: 0.9, fontWeight: 500 }}>Always Active</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
                  <X size={20} />
                </button>
              </div>

              {/* Messages area with dynamic blur */}
              <div 
                ref={scrollRef}
                style={{ 
                  flex: 1, 
                  padding: 20, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 20,
                  filter: showAnimation ? 'blur(8px)' : 'none',
                  transition: 'filter 0.3s ease'
                }}
                className="custom-scroll"
              >
                {messages.map((msg, i) => (
                  <div key={i} style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    gap: 6
                  }}>
                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: 18,
                      fontSize: 14,
                      lineHeight: 1.6,
                      background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-subtle)',
                      color: msg.role === 'user' ? 'white' : 'var(--text)',
                      border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                      borderBottomRightRadius: msg.role === 'user' ? 4 : 18,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 18,
                      boxShadow: 'var(--shadow-sm)',
                      fontWeight: 500
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
            </div>

            {/* Input */}
            <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-subtle)',
                padding: '8px 12px',
                borderRadius: 12
              }}>
                <input
                  type="text"
                  placeholder="Ask anything..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: 'var(--text)'
                  }}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading}
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    padding: 6,
                    cursor: 'pointer',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          background: 'white',
          border: '2px solid var(--primary)',
          boxShadow: '0 8px 24px rgba(31, 78, 121, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          overflow: 'hidden',
          padding: 0
        }}
      >
        {isOpen ? (
          <ChevronDown size={28} color="var(--primary)" />
        ) : (
          <img src="/salesperson_icon.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="AI" />
        )}
      </motion.button>
    </div>
  );
};

export default AIAssistant;
