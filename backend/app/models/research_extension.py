import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class EvidenceSpan(Base):
    """
    Evidence-grounded spans extracted from conversation transcripts.
    Guarantees that quotes are exact substrings with character offsets.
    """
    __tablename__ = "evidence_spans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_recording_id = Column(
        UUID(as_uuid=True),
        ForeignKey("voice_recordings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    candidate_transition = Column(String(100), nullable=False)  # e.g., "qualification->proposal"
    quote = Column(Text, nullable=False)                       # Exact substring of transcript
    start_index = Column(Integer, nullable=False)              # 0-based inclusive char offset
    end_index = Column(Integer, nullable=False)                # Exclusive char offset
    rationale = Column(Text, nullable=True)                    # LLM-generated justification
    recommend_transition = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    voice_recording = relationship("VoiceRecording", backref="evidence_spans")


class StageTransitionDecision(Base):
    """
    Immutable audit trail for all stage transition decisions made by the Decision Gate.
    Safety Invariant: Only the Decision Gate writes lead.status, and every action is logged here.
    """
    __tablename__ = "stage_transition_decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(
        UUID(as_uuid=True),
        ForeignKey("leads.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    deal_id = Column(
        UUID(as_uuid=True),
        ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    voice_recording_id = Column(
        UUID(as_uuid=True),
        ForeignKey("voice_recordings.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    candidate_transition = Column(String(100), nullable=False)  # proposed from->to stage
    from_stage = Column(String(50), nullable=True)
    to_stage = Column(String(50), nullable=True)
    raw_score = Column(Float, nullable=False)                   # Pre-calibration fusion score
    calibrated_confidence = Column(Float, nullable=False)       # Calibrated probability [0.0, 1.0]
    decision = Column(String(30), nullable=False)               # 'auto_update' | 'needs_approval' | 'no_update'
    final_stage = Column(String(50), nullable=True)             # Stage actually written to CRM (if any)
    human_action = Column(String(30), nullable=True)            # 'approved' | 'rejected' | 'edited' | None
    human_corrected_stage = Column(String(50), nullable=True)   # Stage if edited by human
    correction_reason = Column(String(100), nullable=True)      # 'wrong evidence read' | 'stage skipped' | etc.
    outcome_won_lost = Column(String(20), nullable=True)        # Tracked post-hoc for validation
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))
    resolved_at = Column(DateTime, nullable=True)

    lead = relationship("Lead", backref="stage_decisions")
    voice_recording = relationship("VoiceRecording", backref="stage_decisions")


class AcousticFeatures(Base):
    """
    Acoustic and prosodic feature vector extracted from raw audio streams (librosa/openSMILE).
    Extracts pitch F0, energy, speaking rate, and vocal hesitation indicators <= 50ms on CPU.
    """
    __tablename__ = "acoustic_features"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_recording_id = Column(
        UUID(as_uuid=True),
        ForeignKey("voice_recordings.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )
    pitch_mean = Column(Float, nullable=True)
    pitch_std = Column(Float, nullable=True)
    energy_mean = Column(Float, nullable=True)
    energy_std = Column(Float, nullable=True)
    speaking_rate = Column(Float, nullable=True)        # Syllables or phonemes / sec
    pause_duration_mean = Column(Float, nullable=True)  # Mean silence duration (sec)
    turn_taking_ratio = Column(Float, nullable=True)    # Rep vs prospect talk ratio
    jitter = Column(Float, nullable=True)               # Micro-frequency perturbation
    shimmer = Column(Float, nullable=True)              # Micro-amplitude perturbation
    extractor = Column(String(50), nullable=False, default="librosa")  # Recorded for reproducibility
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))

    voice_recording = relationship("VoiceRecording", backref="acoustic_data")


class AnnotationLabel(Base):
    """
    Ground-truth dataset for the pilot evaluation (N=300-500).
    STRICTLY KEPT SEPARATE from merged_lead_dataset.csv per rules.md #6 & #8.
    """
    __tablename__ = "annotation_labels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    voice_recording_id = Column(
        UUID(as_uuid=True),
        ForeignKey("voice_recordings.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )
    annotator_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    pre_conversation_stage = Column(String(50), nullable=False)
    expert_post_conversation_stage = Column(String(50), nullable=False)  # Ground-truth target
    notes = Column(Text, nullable=True)
    is_synthetic = Column(Boolean, nullable=False, default=False)        # Never defaults to False silently
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, server_default=text("now()"))


class DecisionGateConfig(Base):
    """
    Configurable decision gate thresholds (tau_high, tau_low).
    Per rules.md #13: Thresholds must live in configuration, NOT hardcoded constants.
    """
    __tablename__ = "decision_gate_config"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    tau_high = Column(Float, nullable=False, default=0.85)  # Auto-update threshold
    tau_low = Column(Float, nullable=False, default=0.55)   # Human-approval floor
    max_false_advancement_rate = Column(Float, nullable=False, default=0.01) # Target FAR <= 1%
    is_active = Column(Boolean, nullable=False, default=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
