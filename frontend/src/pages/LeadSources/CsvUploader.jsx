import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../../contexts/ToastContext';

const CsvUploader = ({ onUploadSuccess }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { show: showToast } = useToast();

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

  const handleFiles = async (file) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      showToast({ type: 'error', message: 'Only CSV and Excel files are supported.' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('voiceiq_token');
      const res = await axios.post('/api/leads/import', formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast({ type: 'success', message: `Successfully imported ${res.data.imported} leads.` });
      if (res.data.errors && res.data.errors.length > 0) {
        showToast({ type: 'warning', message: `${res.data.errors.length} rows had errors.` });
      }
      
      if (onUploadSuccess) onUploadSuccess();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      showToast({ type: 'error', message: err.response?.data?.detail || 'Failed to import file.' });
    } finally {
      setUploading(false);
    }
  };

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
