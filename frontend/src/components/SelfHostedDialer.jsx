import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const SelfHostedDialer = ({ lead, onClose }) => {
  const { user, getToken } = useUser();
  const { show } = useToast();
  const [callStatus, setCallStatus] = useState('idle'); // idle, calling, ringing, connected, ended
  const [duration, setDuration] = useState(0);
  
  const wsRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);
  const [volume, setVolume] = useState(0);

  useEffect(() => {
    // Initialize WebSocket signaling
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/voice/ws?user_id=${user?.id}`;
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'answer') {
        setCallStatus('connected');
        startTimer();
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(data));
      } else if (data.type === 'candidate') {
        if (pcRef.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      }
    };

    return () => {
      cleanupCall();
      if (wsRef.current) wsRef.current.close();
    };
  }, [user]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startVisualizer = (stream) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);
    
    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Uint8Array(bufferLength);
    
    const updateVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArrayRef.current[i];
      }
      const avg = sum / bufferLength;
      setVolume(avg);
      animationFrameRef.current = requestAnimationFrame(updateVolume);
    };
    
    updateVolume();
  };

  const startCall = async () => {
    setCallStatus('calling');
    try {
      let stream;
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC not supported or secure context required');
        }
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (mediaErr) {
        console.warn('Microphone access failed, falling back to mock stream.', mediaErr);
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) throw new Error('AudioContext not supported in this browser.');
        const ctx = new AudioContext();
        const dest = ctx.createMediaStreamDestination();
        
        // Create a silent oscillator so the stream has actual audio data flowing
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0; // silent
        osc.connect(gain);
        gain.connect(dest);
        osc.start();
        
        stream = dest.stream;
        show({ type: 'info', message: 'Microphone unavailable. Using simulated audio for demo.' });
      }

      localStreamRef.current = stream;
      startVisualizer(stream);

      // Start Recording
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      } catch (e) {
        console.warn('audio/webm not supported, falling back to default format.');
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadRecording(audioBlob);
      };

      mediaRecorder.start();

      // Initialize WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'candidate',
            candidate: event.candidate
          }));
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer to signaling server
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'offer',
          sdp: offer,
          to: lead.phone
        }));
      }

      setCallStatus('ringing');

    } catch (err) {
      console.error('Failed to start call', err);
      setCallStatus('idle');
      show({ type: 'error', message: `Call engine failed: ${err.message || 'Unknown error'}` });
    }
  };

  const endCall = () => {
    setCallStatus('ended');
    stopTimer();
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'hangup' }));
    }
    
    cleanupCall();
    
    // Auto-close dialer after 2.5 seconds when ended
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  const cleanupCall = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setVolume(0);
  };

  const uploadRecording = async (blob) => {
    const formData = new FormData();
    formData.append('file', blob, 'call_recording.webm');
    formData.append('lead_id', lead.id);

    try {
      await fetch('/api/voice/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      });
      show({ type: 'success', message: 'Call recording securely uploaded & transcribed.' });
    } catch (err) {
      console.error("Failed to upload recording", err);
      show({ type: 'error', message: 'Failed to upload call recording.' });
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, width: 340,
      background: 'var(--bg-surface)', borderRadius: 20, 
      boxShadow: '0 12px 40px rgba(0,0,0,0.2), 0 0 0 1px var(--border)',
      zIndex: 9999, overflow: 'hidden', display: 'flex', flexDirection: 'column'
    }}>
      {/* Dialer Header */}
      <div style={{ 
        padding: '20px 24px', 
        background: callStatus === 'connected' ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'var(--bg-subtle)', 
        color: callStatus === 'connected' ? 'white' : 'var(--text)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        borderBottom: '1px solid var(--border-subtle)',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 4, color: callStatus === 'connected' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>
            OUTBOUND CALL
          </div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {lead.title}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, fontWeight: 500, color: callStatus === 'connected' ? 'rgba(255,255,255,0.9)' : 'var(--text-muted)' }}>
            {lead.phone || 'No Phone Number'}
          </p>
        </div>
        <button onClick={onClose} style={{ 
          background: callStatus === 'connected' ? 'rgba(255,255,255,0.2)' : 'var(--bg)', 
          border: 'none', 
          color: callStatus === 'connected' ? 'white' : 'var(--text-muted)', 
          cursor: 'pointer',
          width: 32, height: 32, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{ padding: '32px 24px', textAlign: 'center', background: 'var(--bg-surface)' }}>
        
        {/* Call Status Text */}
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8, fontVariantNumeric: 'tabular-nums' }}>
          {callStatus === 'idle' && "Ready"}
          {callStatus === 'calling' && "Connecting..."}
          {callStatus === 'ringing' && "Ringing..."}
          {callStatus === 'connected' && formatTime(duration)}
          {callStatus === 'ended' && "Call Ended"}
        </div>

        <div style={{ fontSize: 13, fontWeight: 600, color: callStatus === 'connected' ? '#10B981' : 'var(--text-muted)', marginBottom: 32 }}>
          {callStatus === 'idle' && "DaleIQ WebRTC Dialer"}
          {callStatus === 'calling' && "Initiating peer connection"}
          {callStatus === 'ringing' && "Waiting for answer"}
          {callStatus === 'connected' && "• Recording & AI Transcription Active"}
          {callStatus === 'ended' && "Processing AI Analysis..."}
        </div>

        {/* Live Audio Visualizer (Waveform Ring) */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32, height: 96 }}>
          {(callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connected') ? (
            <div style={{ 
              width: 96, height: 96, borderRadius: '50%', 
              background: `rgba(16, 185, 129, ${0.05 + (volume / 255) * 0.2})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 0 ${volume / 3}px rgba(16, 185, 129, 0.1)`,
              transition: 'all 0.05s ease-out'
            }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                transform: `scale(${1 + (volume / 255) * 0.15})`,
                transition: 'transform 0.05s ease-out',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
              }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          ) : (
            <div style={{ 
              width: 96, height: 96, borderRadius: '50%', background: 'var(--bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)'
            }}>
              <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          {callStatus === 'idle' || callStatus === 'ended' ? (
            <button 
              onClick={startCall}
              disabled={!lead.phone || callStatus === 'ended'}
              style={{
                width: 64, height: 64, borderRadius: 32, background: lead.phone && callStatus !== 'ended' ? '#10B981' : 'var(--bg-subtle)', 
                border: 'none', color: lead.phone && callStatus !== 'ended' ? 'white' : 'var(--text-muted)', 
                cursor: lead.phone && callStatus !== 'ended' ? 'pointer' : 'not-allowed', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: lead.phone && callStatus !== 'ended' ? '0 8px 24px rgba(16, 185, 129, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={endCall}
              style={{
                width: 64, height: 64, borderRadius: 32, background: '#EF4444', 
                border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s ease'
              }}
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.516l2.257-1.13a1 1 0 00.502-1.21L9.284 4.684A1 1 0 008.335 4H5.284A2.001 2.001 0 005 3z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfHostedDialer;
