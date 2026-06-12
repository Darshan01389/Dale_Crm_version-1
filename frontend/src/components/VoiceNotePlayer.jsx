import React, { useRef, useState, useEffect } from 'react';

const MOCK_PEAKS = Array.from({ length: 50 }, (_, i) =>
  0.15 + Math.abs(Math.sin(i * 0.4)) * 0.85
);

const SignalPill = ({ label, type }) => {
  let bg = '#FBE9D2', border = '#B4670F', color = '#B4670F';
  if (type === 'positive') { bg = '#EAF3DE'; border = '#4F46E5'; color = '#4F46E5'; }
  else if (type === 'negative') { bg = '#FEE2E2'; border = '#EF4444'; color = '#EF4444'; }
  else if (type === 'bant') { bg = '#E0E7FF'; border = '#6366F1'; color = '#4338CA'; }
  
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      padding: '3px 8px', borderRadius: 4, marginRight: 6, marginTop: 4,
      background: bg, color: color, border: `1px solid ${border}`,
    }}>
      {label.toUpperCase()}
    </span>
  );
};

const Waveform = ({ peaks = MOCK_PEAKS, progress = 0.45, compact = false }) => {
  const h = compact ? 28 : 40;
  return (
    <svg width="100%" height={h} viewBox={`0 0 200 ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {peaks.map((p, i) => {
        const x = (i / peaks.length) * 200;
        const barH = p * h;
        const y = (h - barH) / 2;
        const played = i / peaks.length < progress;
        return (
          <rect
            key={i} x={x} y={y} width={2.5} height={barH}
            rx={1} fill={played ? 'var(--primary)' : 'var(--border)'}
          />
        );
      })}
    </svg>
  );
};

/**
 * VoiceNotePlayer
 * variant: 'inbound' | 'outbound' | 'call'
 */
const VoiceNotePlayer = ({
  variant = 'inbound',
  audioSrc = null,
  waveformPeaks = MOCK_PEAKS,
  transcript = 'Can we discuss the enterprise pricing for 50 users? I\'m looking for the bulk discount we discussed.',
  signals = [],
  duration = '2:14',
  channel = 'WhatsApp',
  sender = 'Lead',
  timestamp = '4:20 PM',
  extraMetadata = '{}',
}) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const audioRef = useRef(null);

  const meta = (() => {
    if (typeof extraMetadata === 'object' && extraMetadata !== null) return extraMetadata;
    try { return JSON.parse(extraMetadata || '{}'); } catch { return {}; }
  })();

  const toggleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const togglePlay = () => {
    if (!audioSrc) return;
    if (playing) { audioRef.current?.pause(); setPlaying(false); }
    else          { audioRef.current?.play();  setPlaying(true); }
  };

  if (variant === 'call') {
    return (
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 16, padding: 20, margin: '12px 0',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.1em' }}>
            VOICE CALL · {duration} · {timestamp}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{channel}</span>
        </div>

        {/* Waveform with signal markers */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Waveform peaks={waveformPeaks} progress={progress} />
          {signals.map((sig, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${sig.timestamp * 100}%`,
              width: 2, borderRadius: 2,
              background: sig.type === 'positive' ? '#4F46E5' : '#B4670F',
              opacity: 0.7,
            }} title={sig.label} />
          ))}
        </div>

        {transcript && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{transcript.length > 180 ? transcript.slice(0, 180) + '…' : transcript}"
          </p>
        )}

        {signals.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            {signals.map((sig, i) => <SignalPill key={i} label={sig.label} type={sig.type} />)}
          </div>
        )}

        {meta.bant_qualification && Object.keys(meta.bant_qualification).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 4 }}>BANT QUALIFICATION</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(meta.bant_qualification).map(([k, v]) => (
                <div key={k} style={{ 
                  fontSize: 10, padding: '2px 6px', borderRadius: 4, 
                  background: v ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: v ? '#10B981' : '#EF4444', border: `1px solid ${v ? '#10B981' : '#EF4444'}`,
                  fontWeight: 600
                }}>
                  {v ? '✓' : '✗'} {k.split('_')[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        )}

        {meta.objections && meta.objections.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>OBJECTIONS</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text)' }}>
              {meta.objections.map((obj, i) => <li key={i}>{obj}</li>)}
            </ul>
          </div>
        )}

        {meta.action_items && meta.action_items.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--primary)', marginBottom: 4 }}>ACTION ITEMS</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--text)' }}>
              {meta.action_items.map((act, i) => <li key={i}>{act}</li>)}
            </ul>
          </div>
        )}

        <button style={{
          background: 'none', border: 'none', padding: 0,
          color: 'var(--primary)', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', textDecoration: 'underline',
          minHeight: 'auto', minWidth: 'auto',
        }}>
          View full transcript →
        </button>
        {audioSrc && <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} onTimeUpdate={e => setProgress(e.target.currentTime / e.target.duration)} />}
      </div>
    );
  }

  const isOutbound = variant === 'outbound';

  return (
    <div style={{
      alignSelf: isOutbound ? 'flex-end' : 'flex-start',
      maxWidth: '78%',
      background: isOutbound ? 'var(--primary)' : 'var(--bg-surface)',
      border: isOutbound ? 'none' : '1px solid var(--border-subtle)',
      borderRadius: 16,
      borderBottomRightRadius: isOutbound ? 4 : 16,
      borderBottomLeftRadius:  isOutbound ? 16 : 4,
      padding: '12px 16px',
      boxShadow: isOutbound ? '0 4px 12px var(--primary-glow)' : 'var(--shadow-sm)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: isOutbound ? 'rgba(255,255,255,0.7)' : 'var(--text-micro)', letterSpacing: '0.06em' }}>
          {channel.toUpperCase()} · {sender}
        </span>
        <span style={{ fontSize: 10, color: isOutbound ? 'rgba(255,255,255,0.5)' : 'var(--text-micro)' }}>{timestamp} · {duration}</span>
      </div>

      {/* Play + Waveform */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <button
          onClick={togglePlay}
          aria-label={playing ? 'Pause voice note' : 'Play voice note'}
          disabled={!audioSrc}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: isOutbound ? 'rgba(255,255,255,0.2)' : 'var(--primary)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: audioSrc ? 'pointer' : 'default', flexShrink: 0,
            fontSize: 14, minHeight: 'auto', minWidth: 'auto',
            opacity: audioSrc ? 1 : 0.5,
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div style={{ flex: 1 }}>
          <Waveform peaks={waveformPeaks} progress={progress} compact />
        </div>
        <button 
          onClick={toggleSpeed}
          style={{ 
            fontSize: 11, 
            color: isOutbound ? 'rgba(255,255,255,0.8)' : 'var(--text-micro)', 
            fontWeight: 700,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: 4
          }}
        >
          {speed}×
        </button>
      </div>

      {!audioSrc && (
        <div style={{ fontSize: 10, color: isOutbound ? 'rgba(255,255,255,0.5)' : 'var(--text-micro)', marginBottom: 8 }}>
          Processing audio…
        </div>
      )}

      {/* Transcript */}
      <div style={{ borderTop: `1px solid ${isOutbound ? 'rgba(255,255,255,0.15)' : 'var(--border-subtle)'}`, paddingTop: 8, marginTop: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', color: isOutbound ? 'rgba(255,255,255,0.5)' : 'var(--text-micro)' }}>
          AUTO-TRANSCRIBED
        </span>
        <p style={{ fontSize: 12, color: isOutbound ? 'rgba(255,255,255,0.8)' : 'var(--text)', margin: '4px 0 0', lineHeight: 1.6, fontWeight: 400 }}>
          {transcript}
        </p>
      </div>

      {/* Signals (inbound only) */}
      {!isOutbound && signals.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {signals.map((sig, i) => <SignalPill key={i} label={sig.label} type={sig.type} />)}
        </div>
      )}

      {audioSrc && <audio ref={audioRef} src={audioSrc} onEnded={() => setPlaying(false)} onTimeUpdate={e => setProgress(e.target.currentTime / e.target.duration)} />}
    </div>
  );
};

export default VoiceNotePlayer;
