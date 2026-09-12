import React, { useState } from 'react';

const STAGES = ['new', 'contacted', 'discovery', 'proposal', 'negotiation', 'won', 'lost'];
const CORRECTION_REASONS = [
  'wrong evidence read',
  'stage skipped',
  'not enough info',
  'customer requested delay',
  'pricing mismatch',
  'other',
];

const HumanApprovalDrawer = ({ decision, onResolved, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(decision?.to_stage || 'proposal');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'rejected' | 'edited'
  const [correctionReason, setCorrectionReason] = useState(CORRECTION_REASONS[0]);
  const [freeTextReason, setFreeTextReason] = useState('');

  if (!decision) return null;

  const token = localStorage.getItem('voiceiq_token');
  const confidencePct = Math.round((decision.calibrated_confidence || 0.5) * 100);
  const band =
    confidencePct >= 80 ? 'Likely' : confidencePct >= 50 ? 'Moderate' : 'Uncertain';
  const bandColor =
    confidencePct >= 80 ? 'var(--success)' : confidencePct >= 50 ? 'var(--warning)' : 'var(--danger)';

  const handleResolve = async (action, correctedStage = null, reason = null) => {
    setLoading(true);
    try {
      const payload = {
        action: action,
        human_corrected_stage: correctedStage,
        correction_reason: reason || freeTextReason || correctionReason,
      };

      const res = await fetch(`/api/research/decisions/${decision.id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        onResolved?.(data);
        setShowReasonModal(false);
        setShowEditModal(false);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to resolve decision');
      }
    } catch (e) {
      alert('Network error while resolving decision');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    handleResolve('approved');
  };

  const promptReject = () => {
    setPendingAction('rejected');
    setShowReasonModal(true);
  };

  const promptEdit = () => {
    setShowEditModal(true);
  };

  const submitEdit = () => {
    setShowEditModal(false);
    setPendingAction('edited');
    setShowReasonModal(true);
  };

  const confirmReasonAndSubmit = () => {
    const finalReason = freeTextReason.trim()
      ? `${correctionReason}: ${freeTextReason.trim()}`
      : correctionReason;
    handleResolve(pendingAction, pendingAction === 'edited' ? selectedStage : null, finalReason);
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 20,
        boxShadow: 'var(--shadow-md)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--warning)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          >
            Needs Human Approval &bull; Selective Prediction
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Candidate Transition Detected
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Stage Transition Diff Chip & Confidence Band */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '10px 14px',
          background: 'var(--bg-subtle)',
          borderRadius: 8,
          marginBottom: 14,
        }}
      >
        {/* Diff Chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {decision.from_stage || 'current'}
          </span>
          <span style={{ color: 'var(--primary)', fontWeight: 900 }}>➔</span>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              background: 'rgba(79, 70, 229, 0.12)',
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
            }}
          >
            {decision.to_stage}
          </span>
        </div>

        {/* Calibrated Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>
            Calibrated Confidence:
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'var(--bg-surface)',
              border: `1px solid ${bandColor}`,
              color: bandColor,
            }}
          >
            {confidencePct}% ({band})
          </span>
        </div>
      </div>

      {/* Evidence Spans Section */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            marginBottom: 6,
          }}
        >
          Grounding Evidence Quotes (Exact Substring Verified)
        </div>

        {decision.evidence_spans && decision.evidence_spans.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {decision.evidence_spans.map((ev, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  background: 'rgba(79, 70, 229, 0.04)',
                  borderLeft: '3px solid var(--primary)',
                  fontSize: 12,
                }}
              >
                <div style={{ fontStyle: 'italic', color: 'var(--text)', marginBottom: 3 }}>
                  "{ev.quote}"
                </div>
                {ev.rationale && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                    <strong style={{ color: 'var(--primary)' }}>Rationale:</strong> {ev.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No textual quotes recorded. Decision based on multimodal acoustic and CRM context signals.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button
          onClick={promptReject}
          disabled={loading}
          style={{
            padding: '7px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid var(--danger)',
            background: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
          }}
        >
          Reject (No Change)
        </button>

        <button
          onClick={promptEdit}
          disabled={loading}
          style={{
            padding: '7px 14px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid var(--warning)',
            background: 'transparent',
            color: 'var(--warning)',
            cursor: 'pointer',
          }}
        >
          Edit Stage
        </button>

        <button
          onClick={handleApprove}
          disabled={loading}
          style={{
            padding: '7px 18px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            border: 'none',
            background: 'var(--success)',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
          }}
        >
          {loading ? 'Executing...' : `Approve (${decision.to_stage})`}
        </button>
      </div>

      {/* Stage Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 380,
              width: '90%',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16 }}>Select Correct Stage</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Human override will be logged in audit trail for model retraining.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
              {STAGES.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStage(st)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'capitalize',
                    border: selectedStage === st ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: selectedStage === st ? 'rgba(79, 70, 229, 0.1)' : 'var(--bg-subtle)',
                    color: selectedStage === st ? 'var(--primary)' : 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitEdit}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                Next (Capture Reason)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Reason Capture Modal */}
      {showReasonModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 12,
              padding: 24,
              maxWidth: 420,
              width: '90%',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>
              {pendingAction === 'rejected' ? 'Reason for Rejection' : 'Reason for Stage Override'}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Required by Research Extension audit policy (FR8 / correction-logging).
            </p>

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Primary Reason:
            </label>
            <select
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--text)',
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {CORRECTION_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Additional Notes (Optional):
            </label>
            <textarea
              value={freeTextReason}
              onChange={(e) => setFreeTextReason(e.target.value)}
              placeholder="Provide context for offline model retraining..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'var(--bg-subtle)',
                color: 'var(--text)',
                fontSize: 12,
                marginBottom: 16,
                resize: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowReasonModal(false)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmReasonAndSubmit}
                disabled={loading}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: pendingAction === 'rejected' ? 'var(--danger)' : 'var(--primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                {loading ? 'Submitting...' : 'Confirm & Log Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanApprovalDrawer;
