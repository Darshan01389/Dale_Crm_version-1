import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

const CHECKLIST_KEY = 'daleiq_setup_checklist_v1';

const SetupChecklist = () => {
  const { profile } = useUser();
  const { show: showToast } = useToast();

  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(CHECKLIST_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Exclude the deprecated "Make first call" task from restored items
        return parsed.filter(i => i.id !== 'call');
      } catch (e) {
        console.error("Failed to parse checklist cache:", e);
      }
    }
    return [
      { id: 'wa', label: 'Connect WhatsApp', hint: 'Sync business conversations', done: true },
      { id: 'sms', label: 'Connect SMS', hint: 'Enable bulk text outreach', done: true },
      { id: 'contacts', label: 'Import Contacts', hint: 'Upload your CSV/Excel list', done: false, recommended: true },
      { id: 'team', label: 'Invite Team', hint: 'Add up to 5 collaborators', done: false },
    ];
  });

  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('daleiq_setup_checklist_dismissed') === 'true';
  });
  const [activeAction, setActiveAction] = useState(null);

  // Contacts Import state
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);
  const fileInputRef = useRef(null);

  // Invite Team state
  const [copied, setCopied] = useState(false);
  const [orgJoinCode, setOrgJoinCode] = useState('102394');

  React.useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem('voiceiq_token');
        if (!token) return;
        const res = await axios.get('/api/company/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          setOrgJoinCode(res.data[0].join_code || '102394');
        }
      } catch (err) {
        console.error("Failed to load company join code inside checklist:", err);
      }
    };
    fetchCompany();
  }, []);

  if (dismissed) return null;

  const doneCount = items.filter(i => i.done).length;

  const updateItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem(CHECKLIST_KEY, JSON.stringify(newItems));
  };

  const handleToggleDone = (id) => {
    const next = items.map(item => item.id === id ? { ...item, done: !item.done } : item);
    updateItems(next);
  };

  const handleStartAction = (id) => {
    if (activeAction === id) {
      setActiveAction(null);
    } else {
      setActiveAction(id);
    }
  };

  // Contacts Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['.csv', '.xlsx', '.xls'];
      const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (validTypes.includes(fileExt)) {
        setSelectedFile(file);
        setImportError(null);
      } else {
        setImportError("Unsupported file type. Please upload a CSV or Excel file.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportError(null);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  const handleImportContacts = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const token = localStorage.getItem("voiceiq_token");
      const res = await axios.post("/api/leads/import", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.status === "success") {
        setImportResult(res.data);
        showToast({ type: 'success', message: `Successfully imported ${res.data.imported} contacts!` });
        
        // Mark task as done in checklist
        const next = items.map(item => item.id === 'contacts' ? { ...item, done: true } : item);
        updateItems(next);
      } else {
        setImportError(res.data.detail || "Import failed. Please try again.");
      }
    } catch (err) {
      console.error("Error importing contacts:", err);
      const errMsg = err.response?.data?.detail || "An error occurred during file upload. Ensure columns are correctly mapped.";
      setImportError(errMsg);
    } finally {
      setImporting(false);
    }
  };

  const resetImportState = () => {
    setSelectedFile(null);
    setImportResult(null);
    setImportError(null);
  };

  // Team Invite actions
  const orgName = profile?.name ? `${profile.name}'s Org` : 'DaleIQ Demo Org';
  const inviteLink = `${window.location.origin}/register?code=${orgJoinCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    showToast({ type: 'success', message: 'Invite link copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompleteTeamInvite = () => {
    const next = items.map(item => item.id === 'team' ? { ...item, done: true } : item);
    updateItems(next);
    setActiveAction(null);
    showToast({ type: 'success', message: 'Team invites completed!' });
  };

  return (
    <div className="card glass animate-in" style={{ padding: 28, marginBottom: 24, border: '2px solid rgba(79, 70, 229, 0.25)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
      {/* Decorative Glow Orb */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '30%', height: '30%', background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', opacity: 0.5 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, position: 'relative', zIndex: 1 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            🚀 Setup Checklist
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{doneCount} of {items.length} done</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Estimated 10 minutes total</span>
          </div>
        </div>
        <button 
          onClick={() => {
            setDismissed(true);
            localStorage.setItem('daleiq_setup_checklist_dismissed', 'true');
          }}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 'auto', minWidth: 'auto', padding: '4px 8px' }}
        >
          Hide
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, marginBottom: 24, overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #8B5CF6 100%)', 
          width: `${(doneCount / items.length) * 100}%`, transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} />
      </div>

      {/* Checklist items list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
        {items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
            borderRadius: 14, background: item.done ? 'var(--bg-subtle)' : 'var(--bg-surface)',
            border: `1px solid ${item.done ? 'var(--border-subtle)' : 'var(--border)'}`,
            opacity: item.done ? 0.65 : 1,
            transition: 'all 0.2s ease',
          }}>
            <div 
              onClick={() => handleToggleDone(item.id)}
              style={{
                width: 24, height: 24, borderRadius: '50%', border: `2px solid ${item.done ? 'var(--primary)' : 'var(--text-muted)'}`,
                display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                background: item.done ? 'var(--primary)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              {item.done && <span style={{ color: 'white', fontSize: 13, fontWeight: 'bold' }}>✓</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: 14, fontWeight: 800, 
                textDecoration: item.done ? 'line-through' : 'none',
                color: item.done ? 'var(--text-muted)' : 'var(--text)'
              }}>
                {item.label}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.hint}</div>
            </div>
            {item.recommended && !item.done && (
              <span style={{ 
                padding: '4px 10px', borderRadius: 8, background: '#FEF3C7', 
                color: '#92400E', fontSize: 10, fontWeight: 900, letterSpacing: '0.05em'
              }}>
                RECOMMENDED
              </span>
            )}
            {!item.done && (
              <button 
                onClick={() => handleStartAction(item.id)}
                className="btn-secondary"
                style={{ 
                  background: activeAction === item.id ? 'var(--primary)' : 'transparent',
                  color: activeAction === item.id ? 'white' : 'var(--primary)',
                  borderColor: 'var(--primary)',
                  fontSize: 13, fontWeight: 700, padding: '6px 16px', borderRadius: 10,
                  minHeight: 'auto', minWidth: 'auto', height: 36, transition: 'all 0.2s ease'
                }}
              >
                {activeAction === item.id ? 'Collapse' : 'Start →'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── EXPANDED ACTION WORSPACE ── */}
      {activeAction && (
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', animation: 'fadeIn 0.3s ease-out' }}>
          
          {/* Action 1: Import Contacts */}
          {activeAction === 'contacts' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  📥 Import Leads from Spreadsheet
                </h4>
                <button 
                  className="btn-secondary" 
                  onClick={resetImportState}
                  style={{ minHeight: 'auto', minWidth: 'auto', height: 28, padding: '0 10px', fontSize: 11, borderRadius: 6, display: selectedFile || importResult ? 'inline-flex' : 'none' }}
                >
                  Clear & Reset
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                Drag and drop your spreadsheet below. DaleIQ auto-maps common headers like <strong>Name</strong>, <strong>Email</strong>, <strong>Phone</strong>, and <strong>Company</strong>, immediately triggering AI priority scoring in the background.
              </p>

              {/* Upload States */}
              {importResult ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
                    ✓
                  </div>
                  <h5 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 4px', color: 'var(--text)' }}>Spreadsheet Successfully Imported!</h5>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                    Successfully imported <strong>{importResult.imported}</strong> new contacts. AI scoring pipelines have been dispatched in the background.
                  </p>
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div style={{ textAlign: 'left', background: 'var(--bg-subtle)', borderRadius: 8, padding: 12, fontSize: 12, color: 'var(--danger)', maxHeight: 120, overflowY: 'auto' }}>
                      <strong>Row Processing Warnings:</strong>
                      <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                        {importResult.errors.map((e, idx) => <li key={idx}>{e}</li>)}
                      </ul>
                    </div>
                  )}
                  <button 
                    className="btn-primary" 
                    onClick={() => { resetImportState(); setActiveAction(null); }}
                    style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, height: 38, fontSize: 13 }}
                  >
                    Done
                  </button>
                </div>
              ) : importing ? (
                <div style={{ padding: 40, textAlign: 'center', background: 'var(--bg-subtle)', borderRadius: 12, border: '2px dashed var(--border)' }}>
                  <div style={{ display: 'inline-block', width: 36, height: 36, border: '3px solid var(--primary-glow)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 16 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Processing contacts & running AI Models...</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>This might take a moment depending on the spreadsheet size.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {importError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger)', borderRadius: 10, padding: '10px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚠</span> {importError}
                    </div>
                  )}

                  {/* Dropzone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    style={{
                      border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
                      background: dragActive ? 'var(--primary-glow)' : 'var(--bg-surface)',
                      borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".csv, .xlsx, .xls"
                      style={{ display: 'none' }}
                    />
                    
                    {selectedFile ? (
                      <div>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', wordBreak: 'break-all' }}>{selectedFile.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{(selectedFile.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.8 }}>📤</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Drag and drop your spreadsheet here</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>or click to browse from files (.csv, .xlsx, .xls)</div>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions */}
                  {selectedFile && (
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                      <button 
                        className="btn-secondary" 
                        onClick={resetImportState}
                        style={{ height: 42, padding: '0 20px', borderRadius: 10, fontSize: 13 }}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn-primary" 
                        onClick={handleImportContacts}
                        style={{ height: 42, padding: '0 24px', borderRadius: 10, fontSize: 13, background: 'var(--primary)' }}
                      >
                        🚀 Ingest & Run AI Scoring
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action 2: Invite Team */}
          {activeAction === 'team' && (
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
                👥 Invite Collaborators to "{orgName}"
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
                Point team members to scan the organization QR code or send them the unique join link. Upon registering, they will be auto-joined into your team squads.
              </p>

              <div style={{ 
                background: 'rgba(99, 102, 241, 0.05)', 
                border: '1px solid rgba(99, 102, 241, 0.2)', 
                borderRadius: 10, 
                padding: '10px 14px', 
                fontSize: 12, 
                color: 'var(--text-muted)', 
                marginBottom: 20,
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <span>
                  <strong>Mobile scanning note:</strong> If scanning with a phone, ensure both devices are on the same Wi-Fi. Access the CRM on your PC via its local network IP (e.g. <code>http://192.168.x.x:5173</code>) instead of <code>localhost</code> so the generated QR code matches your local IP.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 28, background: 'var(--bg-subtle)', borderRadius: 16, padding: 24, border: '1px solid var(--border)' }}>
                {/* QR Code Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, background: 'white', padding: 14, borderRadius: 12, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteLink)}`} 
                    alt="Organization Invite QR Code"
                    style={{ width: 160, height: 160, display: 'block' }}
                  />
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 4 }}>
                    SCAN TO JOIN
                  </span>
                </div>

                {/* Invite Link Details Column */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                      ORGANIZATION MAGIC CODE
                    </label>
                    <span style={{ fontSize: 18, fontWeight: 900, background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: 8, letterSpacing: '0.05em', border: '1px solid var(--border)', display: 'inline-block', marginBottom: 12 }}>
                      {orgJoinCode}
                    </span>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                      ORGANIZATION JOIN LINK
                    </label>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <input 
                        type="text" 
                        readOnly 
                        value={inviteLink}
                        onClick={(e) => e.target.select()}
                        style={{
                          flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
                          fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-surface)', outline: 'none'
                        }}
                      />
                      <button 
                        onClick={handleCopyLink}
                        className="btn-primary"
                        style={{
                          background: copied ? 'var(--success)' : 'var(--primary)',
                          boxShadow: copied ? 'none' : '0 4px 12px var(--primary-glow)',
                          height: 38, padding: '0 16px', borderRadius: 10, fontSize: 13, minHeight: 'auto', minWidth: 'auto',
                          transition: 'all 0.2s ease',
                          display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        {copied ? 'Copied! ✓' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                    <button 
                      className="btn-primary" 
                      onClick={handleCompleteTeamInvite}
                      style={{ padding: '0 24px', borderRadius: 10, fontSize: 13, height: 40, minHeight: 'auto', minWidth: 'auto' }}
                    >
                      I have invited my team ✓
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => setActiveAction(null)}
                      style={{ padding: '0 16px', borderRadius: 10, fontSize: 13, height: 40, minHeight: 'auto', minWidth: 'auto' }}
                    >
                      Collapse
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes spin { 
          to { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
};

export default SetupChecklist;
