import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

const LogCallModal = ({ isOpen, onClose, contact, onLogged }) => {
  const { show } = useToast();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setNotes('');
      setAudioUrl(null);
      setAudioBlob(null);
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop()); // release mic
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      show({ type: 'error', message: 'Microphone access denied or not available.' });
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contact?.id) return;
    
    setLoading(true);
    try {
      if (audioBlob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'call_recording.webm');
        formData.append('lead_id', contact.id);
        
        const res = await fetch('/api/voice/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('voiceiq_token')}`
          },
          body: formData
        });
        if (!res.ok) throw new Error('Failed to upload call recording');
      } else {
        const res = await fetch('/api/activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('voiceiq_token')}`
          },
          body: JSON.stringify({ 
            lead_id: contact.id, 
            activity_type: 'call', 
            subject: 'Call Logged', 
            body: notes 
          })
        });
        if (!res.ok) throw new Error('Failed to log call notes');
      }
      
      show({ type: 'success', message: 'Call log and recording saved successfully!' });
      onLogged?.();
      onClose();
    } catch (err) {
      console.error(err);
      show({ type: 'error', message: err.message || 'Failed to upload call recording.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 500, background: 'var(--bg-surface)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
        <div style={{ padding: '24px 30px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-subtle)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Log Call</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 4 }}>with {contact?.name || 'Contact'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '30px' }}>
          
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 12, textTransform: 'uppercase' }}>
              Live Recording
            </label>
            
            <div style={{ 
              border: `2px ${isRecording ? 'solid' : 'dashed'} ${isRecording ? '#EF4444' : 'var(--border)'}`, 
              borderRadius: 16, padding: '24px', textAlign: 'center', 
              background: isRecording ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-subtle)',
              transition: 'all 0.3s ease'
            }}>
              
              {!isRecording && !audioUrl && (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
                    Click start when the call begins to record from your microphone.
                  </div>
                  <button type="button" onClick={startRecording} style={{ background: '#EF4444', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                    Start Recording
                  </button>
                </div>
              )}

              {isRecording && (
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'white', padding: '8px 16px', borderRadius: 20, boxShadow: 'var(--shadow-sm)', marginBottom: 16 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16, fontWeight: 600 }}>
                    Recording in progress...
                  </div>
                  <button type="button" onClick={stopRecording} style={{ background: '#111827', color: 'white', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                    Stop Recording
                  </button>
                </div>
              )}

              {audioUrl && !isRecording && (
                <div>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 14, color: 'var(--success)', marginBottom: 16, fontWeight: 700 }}>
                    Recording captured ({formatTime(recordingTime)})
                  </div>
                  <audio src={audioUrl} controls style={{ width: '100%', height: 40, marginBottom: 16 }} />
                  <button type="button" onClick={() => { setAudioUrl(null); setAudioBlob(null); setRecordingTime(0); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'var(--text-muted)' }}>
                    Discard & Retake
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: 30 }}>
            <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', letterSpacing: 1, display: 'block', marginBottom: 10, textTransform: 'uppercase' }}>
              Call Notes
            </label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What was discussed?" 
              style={{ width: '100%', minHeight: 120, padding: 16, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontFamily: 'inherit', resize: 'vertical', fontSize: 14, outline: 'none' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', height: 52, borderRadius: 14, border: 'none', background: 'var(--primary)', color: 'white', fontSize: 16, fontWeight: 800, cursor: loading ? 'default' : 'pointer', boxShadow: '0 8px 20px var(--primary-glow)', transition: 'all 0.2s ease' }}>
            {loading ? 'Saving Call...' : 'Save Call Log'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LogCallModal;
