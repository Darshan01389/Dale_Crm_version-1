import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const CRM_FIELDS = [
  { value: 'title', label: 'Full Name / Title (Required)' },
  { value: 'company', label: 'Company Name' },
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'status', label: 'Lead Status' },
  { value: 'source', label: 'Lead Source' },
  { value: 'notes', label: 'Notes / Description' },
  { value: 'occupation', label: 'Occupation' },
  { value: 'education', label: 'Education' },
  { value: 'age', label: 'Age' },
  { value: 'deal_value', label: 'Deal Value' },
];

const CsvUploader = ({ onUploadSuccess }) => {
  const [step, setStep] = useState('upload'); // 'upload' | 'mapping'
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [preview, setPreview] = useState([]);
  const [mapping, setMapping] = useState({}); // e.g. { "CSV_Header": "crm_field" }

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { show: showToast } = useToast();

  const guessField = (header) => {
    const h = header.toLowerCase().replace(/_/g, ' ').trim();
    if (['title', 'name', 'full name', 'lead name', 'contact name', 'first name', 'last name'].includes(h)) return 'title';
    if (['company', 'organization', 'organisation', 'firm', 'company name'].includes(h)) return 'company';
    if (['email', 'email address', 'mail'].includes(h)) return 'email';
    if (['phone', 'phone number', 'mobile', 'tel', 'contact', 'contact number'].includes(h)) return 'phone';
    if (['status', 'stage', 'lead status'].includes(h)) return 'status';
    if (['source', 'origin', 'lead source'].includes(h)) return 'source';
    if (['notes', 'note', 'description', 'desc', 'comments'].includes(h)) return 'notes';
    if (['occupation', 'job', 'role', 'profession', 'job title'].includes(h)) return 'occupation';
    if (['education', 'degree', 'qualification'].includes(h)) return 'education';
    if (['age'].includes(h)) return 'age';
    if (['deal value', 'deal_value', 'value', 'amount', 'deal amount'].includes(h)) return 'deal_value';
    return '';
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragging(true);
    } else if (e.type === 'dragleave') {
      setDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = async (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      showToast({ type: 'error', message: 'Only CSV and Excel files are supported.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post('/api/leads/import/parse', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const parsedHeaders = res.data.headers || [];
      setHeaders(parsedHeaders);
      setPreview(res.data.preview || []);
      setFile(selectedFile);
      
      // Auto-map based on heuristic guesses
      const initialMapping = {};
      parsedHeaders.forEach(h => {
        const guessed = guessField(h);
        if (guessed) {
          initialMapping[h] = guessed;
        }
      });
      setMapping(initialMapping);
      setStep('mapping');
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.detail || 'Failed to parse file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleImportSubmit = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mapping', JSON.stringify(mapping));

    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post('/api/leads/import', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast({ type: 'success', message: res.data.message || 'Import started in the background.' });
      if (onUploadSuccess) onUploadSuccess();
      resetWizard();
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.detail || 'Failed to import file.' });
    } finally {
      setUploading(false);
    }
  };

  const resetWizard = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setPreview([]);
    setMapping({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (step === 'mapping') {
    return (
      <div className="card" style={{ padding: 24, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 className="text-h3" style={{ margin: 0 }}>Map Columns</h3>
          <p className="text-muted" style={{ margin: '4px 0 0', fontSize: 13 }}>
            Select which CRM field matches each column in your spreadsheet.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
          {/* Left panel: mapping configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Column Configuration</h4>
            {headers.map((header) => (
              <div key={header} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-subtle)', padding: 12, borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={header}>
                  {header}
                </span>
                <select
                  value={mapping[header] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMapping(prev => ({
                      ...prev,
                      [header]: val
                    }));
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text)',
                    fontSize: 13,
                    width: 200,
                    outline: 'none'
                  }}
                >
                  <option value="">Ignore / Skip</option>
                  {CRM_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Right panel: Data Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Data Preview (First 3 Rows)</h4>
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-subtle)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)' }}>
                    {headers.map(h => (
                      <th key={h} style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < preview.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {headers.map(h => (
                        <td key={h} style={{ padding: '10px 12px', color: 'var(--text)' }}>
                          {row[h] !== null && row[h] !== undefined ? String(row[h]) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button
            className="btn-secondary"
            onClick={resetWizard}
            disabled={uploading}
            style={{ padding: '10px 20px', borderRadius: 8, fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleImportSubmit}
            disabled={uploading}
            style={{ padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
          >
            {uploading ? 'Queueing Import...' : 'Import Leads'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        border: dragging ? '2px dashed var(--primary)' : '2px dashed var(--border)',
        padding: '40px 24px',
        borderRadius: 16,
        textAlign: 'center',
        background: dragging ? 'var(--primary-glow)' : 'var(--bg-surface)',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div style={{ fontSize: 40, marginBottom: 16 }}>📥</div>
      <h3 className="text-h3" style={{ marginBottom: 8 }}>Drag & Drop to Upload</h3>
      <p className="text-muted" style={{ marginBottom: 24 }}>Supports .csv, .xls, .xlsx</p>
      
      <button 
        className="btn-primary" 
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        disabled={uploading}
        style={{ padding: '10px 24px', borderRadius: 8, fontWeight: 700 }}
      >
        {uploading ? 'Processing...' : 'Browse Files'}
      </button>
    </div>
  );
};

export default CsvUploader;
